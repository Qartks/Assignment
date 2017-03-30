/**
 * Created by qartks on 3/29/17.
 */
module.exports = function (app) {

    app.get("/api/hello", function (req, res) {
        console.log("Hello from GET api call");
    })
};