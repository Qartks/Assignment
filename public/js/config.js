/**
 * Created by qartks on 3/29/17.
 */
(function () {
    angular
        .module("Amne")
        .config(Configuration);
    
    function Configuration($routeProvider) {
        $routeProvider
            .when("/",{
                    templateUrl:"../views/Amne.html",
                    controller :"AmneController",
                    controllerAs :"model"
                })
            .otherwise({
                redirectTo: "/"
            });
    }
})();