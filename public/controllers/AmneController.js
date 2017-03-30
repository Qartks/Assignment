/**
 * Created by qartks on 3/29/17.
 */
(function () {
    angular.module('Amne')
        .controller("AmneController", AmneController);

    function AmneController($scope) {
        var vm = this;

        // Initializing final result array.
        // An arrays of objects of the format
        // [{
        //     place_id : Google Place Id,
        //     place : Object containing the place info
        //              (name, address, rating, etc.),
        //     distance : Total distance from the markers
        // }]
        vm.realEstateAgents = [];

        // Creating Default Map to center on Austin.
        var map = new google.maps.Map(document.getElementById('map'), {
            center : {lat: 30.2672, lng:-97.7431},
            zoom : 10,
            mapTypeControl: false
        });
        // Setting default bounds.
        var defaultBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(30.00, -97.98),
            new google.maps.LatLng(30.55, -97.5)
        );
        // Bounds for when the addresses are selected.
        var bounds = new google.maps.LatLngBounds();
        var options = {
            bounds: defaultBounds
        };

        // Input box are the addresses.
        var inputOne = (document.getElementById('address1'));
        var inputTwo = (document.getElementById('address2'));
        var autocompleteOne = new google.maps.places.Autocomplete(inputOne, options);
        var autocompleteTwo = new google.maps.places.Autocomplete(inputTwo, options);

        // Creating Markers
        var markerOne = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP
        });
        var markerTwo = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP
        });

        // Listener for when an address is selected in the autocomplete.
        autocompleteOne.addListener('place_changed', function () {
            var place = autocompleteOne.getPlace();
            if (!place.geometry) {
                return;
            }
            markerOne.setPlace(
                ({
                    placeId: place.place_id,
                    location: place.geometry.location
                }));
            bounds.extend(place.geometry.location);
            markerOne.setVisible(true);
            map.fitBounds(bounds);
        });
        autocompleteTwo.addListener('place_changed', function () {
            var place = autocompleteTwo.getPlace();

            if (!place.geometry) {
                return;
            }

            markerTwo.setPlace(
                ({
                    placeId: place.place_id,
                    location: place.geometry.location
                }));

            bounds.extend(place.geometry.location);
            markerTwo.setVisible(true);
            map.fitBounds(bounds);
        });

        /*
            Function that takes in an array sorts it (based on the distance)
            and removes duplicates (place_id is the unique identifier).
         */
        var arraysUniqueWithSort = function (originalArray) {
            var newArray = originalArray.sort(function (a, b) {
                return a.distance > b.distance ? 1 : a.distance < b.distance ? -1 : 0;
            });
            var result = [];
            var unique = {};
            newArray.forEach(function(item) {
                if (!unique[item.id]) {
                    result.push(item);
                    unique[item.id] = item;
                }
            });
            return result;
        };

        /*
            On-click listener that resets the result array, the map,
            values of the autocompletes and the markers.
         */
        (document).getElementById("clearEveything").addEventListener('click', function () {
            map = new google.maps.Map(document.getElementById('map'), {
                center : {lat: 30.2672, lng:-97.7431},
                zoom : 10,
                mapTypeControl: false
            });

            markerOne = new google.maps.Marker({
                map: map,
                animation: google.maps.Animation.DROP
            });
            markerTwo = new google.maps.Marker({
                map: map,
                animation: google.maps.Animation.DROP
            });

            inputOne.value = '';
            inputTwo.value = '';

            $scope.$applyAsync(function () {
                vm.realEstateAgents=[];
            });

        });

        /*
            On-click listener.
         */
        (document).getElementById("executeQuery").addEventListener('click', function () {
            // Clears the result array if need be.
            if (vm.realEstateAgents.length!= 0) {
                $scope.$applyAsync(function () {
                    vm.realEstateAgents = [];
                });
            }

            if (inputOne.value == "" || inputTwo.value == "") {
                window.alert("Enter both addresses please!");
                return;
            }

            // Query for Real Estate Agencies within 10 miles of Marker One.
            var request = {
                location: markerOne.place.location,
                radius : '16090',
                type: "real_estate_agency"
            };
            doNearBySearch(request)
                .done(function (res) {

                    // Query for Real Estate Agencies within 10 miles of Marker Two.
                    var request2 = {
                        location: markerTwo.place.location,
                        radius : '16090',
                        type: "real_estate_agency"
                    };
                    doNearBySearch(request2)
                        .done(function (res) {
                            //Search Complete
                        })
                        .fail(function (err) {
                            console.log(err);
                        });
                })
                .fail(function (err) {
                    console.log(err);
                });

        });

        /*
            Using GoogleMap Places API, search for nearby Real Estate Agencies
             within 10 miles(~16090m).
             This function returns a Promise, while also updating the result array.
         */
        function doNearBySearch(request) {
            var placeService = new google.maps.places.PlacesService(map);
            var d = $.Deferred();

            // Searching hte nearby places based on the request.
            placeService.nearbySearch(request, function (results, status) {
                var i;
                if (status == google.maps.places.PlacesServiceStatus.OK) {

                    // For all the nearby places, calculate the distance from each
                    // of the two markers and store it in the final result array.
                    for (i = 0; i < results.length; i++) {
                        getDistanceMatrix(results[i])
                            .done(function (response, result_i) {
                                if (response == null) {
                                    setTimeout(function () {
                                        --i;
                                    }, 1000);
                                } else {
                                    var totalDistance = response.rows[0].elements[0].distance.value + response.rows[1].elements[0].distance.value;
                                    vm.realEstateAgents.push({id: result_i.place_id, place: result_i, distance: totalDistance});
                                    vm.realEstateAgents = arraysUniqueWithSort(vm.realEstateAgents);
                                    $scope.$applyAsync();
                                }
                            })
                            .fail(function (err) {
                                console.log(err);
                            });
                    }
                    d.resolve(vm.realEstateAgents);
                } else {
                    d.reject(status);
                }
            });
            return d.promise();
        }

        /*
            Using GoogleDistanceMatrixAPI, this function requests the distance
            matrix with the origins set as the two markers and the destination
            set as one of the Real Estate Agency found nearby.
            The function also handles the OVER_QUERY_LIMIT by sending a null
            response.
            This function returns a Promise, with a response which contains
            Distance matrix.
         */
        function getDistanceMatrix(result_i) {
            var distanceMatrixSerivce = new google.maps.DistanceMatrixService;
            var d = $.Deferred();
            distanceMatrixSerivce.getDistanceMatrix(
                {
                    origins : [inputOne.value, inputTwo.value],
                    destinations: [result_i.geometry.location],
                    travelMode: google.maps.TravelMode["DRIVING"],
                    unitSystem: google.maps.UnitSystem.IMPERIAL
                }, function (response, status) {
                    if (status == google.maps.DistanceMatrixStatus.OK) {
                        d.resolve(response, result_i);
                    } else if (status == google.maps.DistanceMatrixStatus.OVER_QUERY_LIMIT) {
                        d.resolve(null, result_i);
                    } else {
                        d.reject(status);
                    }
                });

            return d.promise();
        }
        
    }

})();