angular.module('oauth.slack', ['oauth.utils'])
  .factory('$slack', slack);

function slack($q, $http, $cordovaUtility) {
  return { signin: oauthSlack }

  /*
   * Sign into the Slack service
   *
   * @param    string clientId
   * @param    string clientSecret
   * @param    array appScope
   * @param    object options
   * @return   promise
   */
  function oauthSlack(clientId, clientSecret, appScope, options) {
    var deferred = $q.defer();
    if(window.cordova) {
      var cordovaMetadata = cordova.require("cordova/plugin_list").metadata;
      if($cordovaOauthUtility.isInAppBrowserInstalled(cordovaMetadata) === true) {
        var redirect_uri = "http://localhost/callback";
        if(options !== undefined) {
          if(options.hasOwnProperty("redirect_uri")) {
            redirect_uri = options.redirect_uri;
          }
        }

        var browserRef = window.open('https://slack.com/oauth/authorize' + '?client_id=' + clientId + '&redirect_uri=' + redirect_uri + '&state=ngcordovaoauth&scope=' + appScope.join(","), '_blank', 'location=no,clearsessioncache=yes,clearcache=yes');
        browserRef.addEventListener('loadstart', function(event) {
          if((event.url).indexOf(redirect_uri) === 0) {
            requestToken = (event.url).split("code=")[1];
            console.log("Request token is " + requestToken);
            $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
            $http({method: "post", url: "https://slack.com/api/oauth.access", data: "client_id=" + clientId + "&client_secret=" + clientSecret + "&redirect_uri=" + redirect_uri + "&grant_type=authorization_code" + "&code=" + requestToken })
              .success(function(data) {
                deferred.resolve(data);
              })
              .error(function(data, status) {
                deferred.reject("Problem authenticating");
              })
              .finally(function() {
                setTimeout(function() {
                  browserRef.close();
                }, 10);
              });
          }
        });
        browserRef.addEventListener('exit', function(event) {
          deferred.reject("The sign in flow was canceled");
        });
      } else {
        deferred.reject("Could not find InAppBrowser plugin");
      }
    } else {
      deferred.reject("Cannot authenticate via a web browser");
    }

    return deferred.promise;
  }
}

$slack.$inject = ['$q', '$http', '$cordovaUtility'];
