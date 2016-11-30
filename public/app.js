(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(app) {
    app.controller('accountsController', ['$scope', '$http', '$q', 'accountService', 'userService', 'inventoryService', function($scope, $http, $q, accountService, userService, inventoryService) {
        $scope.user = userService.getCurrentUser();
        $scope.myAccountsList = accountService.getMyAccountsServer($scope.user.repId);
        console.log($scope.myAccountsList);

        $scope.addAcct = function() {
            $http({
                method: 'POST',
                url: '/accounts',
                data: {
                    repId: $scope.repId,
                    accountName: $scope.accountName,
                    contact: $scope.contact,
                    email: $scope.email,
                    phone: $scope.phone,
                    address: $scope.address
                },
            }).then(function(response) {
                console.log(response);
                accountService.getMyAccountsServer($scope.user.repId);

                $scope.repId = "";
                $scope.accountName = "";
                $scope.contact = "";
                $scope.email = "";
                $scope.phone = "";
                $scope.address = "";
            })
        };

        $scope.rmAcct = function(acctId, acctName) {
            console.log("acct id to delete", acctId);
            var check = confirm(`are you sure you want to permenently Delete Acct: ${acctName}`);
            if (check) {
                console.log("make a delete request");
                $http({
                    method: 'DELETE',
                    url: `/accounts/${acctId}`
                }).then(function(response) {
                    console.log(`reload ${$scope.user.userName}'s accounts'`);
                    accountService.getMyAccountsServer($scope.user.repId);
                })
            } else {
                console.log(`${acctName} was not deleted`);
            }
        };
        $scope.newOrder = function(account) {
            $scope.orderAcct = account.accountName;
            $scope.items = inventoryService.getMyInventoryServer($scope.user.distributer);
            console.log("beers for order list", $scope.items);
        }
        $scope.orderList = []
        $scope.addToOrderList = function(beerName, beerQty, beerVessel) {

            $scope.orderList.push({
                name: beerName,
                qty: beerQty,
                vessel: beerVessel
            })
        }
        $scope.placeOrder = function(acctName, orderList, repUser, dist, delivery) {
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!
            var yyyy = today.getFullYear();

            if (dd < 10) {
                dd = '0' + dd
            }

            if (mm < 10) {
                mm = '0' + mm
            }

            today = mm + '/' + dd + '/' + yyyy;
            console.log("List of beers to order", orderList);
            orderList.forEach(function(el){
              // for each element of the order list, match the name and vessel type
              console.log('each beer to update',el.name);
              var matchBeer= {};
              var updateBeer = {};
              $http({
                method: 'GET',
                url: `/oneBeer/${el.name}`,

              }).then(function(response){
                console.log("one beer to match", response);
                matchBeer = response.data[0];
              console.log('matchBeer array', matchBeer);
              if (el.vessel === 'cases') {
                updateBeer = {name: el.name, qty: matchBeer.qtyCases - el.qty, field: "qtyCases"}
              } else if (el.vessel === 'sixtels') {
                updateBeer = {name: el.name, qty: matchBeer.qtySixtels - el.qty, field: "qtySixtels"}
              }  else {
                updateBeer = {name: el.name, qty: matchBeer.qtyHalfBarrels - el.qty, field: "HalfBarrels"}
              }
              console.log("send to server", updateBeer);

              $http({
                method:'PUT',
                url: '/inventory',
                data: updateBeer
              }).then(function(response){
                  inventoryService.getMyInventoryServer();
                })
            })

            });

            $http({
                method: 'POST',
                url: '/orders',
                data: {
                    distributer: dist,
                    username: repUser,
                    accountName: acctName,
                    orderDate: today,
                    beers: orderList,
                    deliveryDate: delivery
                },
            }).then(function(response){
              $scope.orderAcct = "";
              $scope.orderList = [];
            })


        }

    }]);
};

},{}],2:[function(require,module,exports){
module.exports = function(app){
  app.controller('inventoryController',['$scope', '$http', 'inventoryService', 'userService', function($scope, $http, inventoryService, userService){

    $scope.user = userService.getCurrentUser();
    $scope.myInventory = inventoryService.getMyInventoryServer($scope.user.distributer);
    console.log($scope.myInventory);

    $scope.addBeer = function() {
            $http({
                method: 'POST',
                url: '/inventory',
                contentType: "application/json",
                data: {
                  name: $scope.name,
                  brewery: $scope.brewery,
                  beerType: $scope.beerType,
                  description: $scope.description,
                  qtyCases: $scope.qtyCases,
                  qtySixtels: $scope.qtySixtels,
                  qtyHalfBarrels: $scope.qtyHalfBarrels,
                  unitPrice: $scope.unitPrice,
                  distributer: $scope.user.distributer
                },
            }).then(function(response){
        // After a response, reload the inventory and clear the fields
        inventoryService.getMyInventoryServer($scope.user.distributer);
        $scope.name = "";
        $scope.brewery = "";
        $scope.beerType = "";
        $scope.description = "";
        $scope.qtyCases = "";
        $scope.qtySixtels = "";
        $scope.qtyHalfBarrels= "";
        $scope.unitPrice = "";
      })
    };







  }]);
};

},{}],3:[function(require,module,exports){
module.exports = function(app) {
    app.controller('loginController', ['$scope', '$http', 'userService', function($scope, $http, userService) {



      $scope.login = function(){
        userService.login($scope.user,$scope.pass);
      }

    }]);
};

},{}],4:[function(require,module,exports){
module.exports = function(app) {
    app.controller('ordersController', ['$scope', '$http', 'userService', 'orderService', function($scope, $http, userService, orderService){

      $scope.user = userService.getCurrentUser();
      $scope.allOrders = orderService.getAllOrders();
      $scope.distOrders = orderService.getDistOrders($scope.user.distributer);
      $scope.myOrders = orderService.getMyOrders($scope.user.username);

      $scope.delivered = function(id){
        $http({
          method: 'PUT',
          url: `/orders/${id}`

        }).then(function(response){
          console.log("deliverd");
        })
      }




    }]);
};

},{}],5:[function(require,module,exports){
module.exports = function(app){
  app.controller('welcomeController',['$scope', '$http', function($scope, $http){







  }]);
};

},{}],6:[function(require,module,exports){
let app = angular.module('Tapp', ['ngRoute']);

// Controllers
require('./controllers/accountsController')(app);
require('./controllers/loginController')(app);
require('./controllers/ordersController')(app);
require('./controllers/inventoryController')(app);
require('./controllers/welcomeController')(app);

// Services
require('./services/userService')(app);
require('./services/inventoryService')(app);
require('./services/accountService')(app);
require('./services/orderService')(app);




//router
app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/', {
      redirectTo: '/welcome',
    })
    .when('/login', {
      controller: 'loginController',
      templateUrl: 'templates/login.html',
    })
    .when('/accounts', {
      controller: 'accountsController',
      templateUrl: 'templates/accounts.html',
    })
    .when('/orders', {
      controller: 'ordersController',
      templateUrl: 'templates/orders.html',
    })
    .when('/welcome', {
      controller: 'welcomeController',
      templateUrl: 'templates/welcome.html',
    })
    .when('/inventory', {
      controller: 'inventoryController',
      templateUrl: 'templates/inventory.html',
    });

}]);

},{"./controllers/accountsController":1,"./controllers/inventoryController":2,"./controllers/loginController":3,"./controllers/ordersController":4,"./controllers/welcomeController":5,"./services/accountService":7,"./services/inventoryService":8,"./services/orderService":9,"./services/userService":10}],7:[function(require,module,exports){
module.exports = function(app){


  app.factory('accountService',['$http', function($http){
    let accountList = [];
    let myAccountsList =[];
    let myAccountsServer = [];

    return{


      getMyAccounts: function(repID){
        let filteredAccounts = [];
        $http({
              method: 'GET',
              url: '/accounts',
          }).then(function(response) {
            console.log("all accounts", response);
            angular.copy(response.data, accountList);
            console.log("account list", accountList);
            accountList.forEach(function(el){
              if(el.repId === repID){
                filteredAccounts.push(el);
              }
            })
            angular.copy(filteredAccounts, myAccountsList);
          })
          console.log("filtered accounts", myAccountsList);
          return myAccountsList
      },

      getMyAccountsServer: function(repId) {
        $http({
            method: 'GET',
            url: `/repAccounts/${repId}`
        }).then(function(response){
          console.log('server side query results :', response );
          angular.copy(response.data, myAccountsServer);
        })
        return myAccountsServer;
      },

      deleteAccount: function(acctId) {
        $http({
          method:'DELETE',
          url:`/accounts/${acctId}`
        })

      }

      // getPages: function(pageNum, perPage){
      //   console.log(eventList);
      //   let start = (pageNum - 1) * perPage;
      //   return eventList.slice(start, start + perPage)
      // },
    };
  }]);
};

},{}],8:[function(require,module,exports){
module.exports = function(app){


  app.factory('inventoryService',['$http', function($http){
    let inventory = [];
    let myInventoryList =[];
    let myInventoryServer = [];

    return{


      getMyInventory: function(distributer){
        $http({
              method: 'GET',
              url: '/inventory',
          }).then(function(response) {
            angular.copy(response.data, inventory);
            inventory.forEach(function(el){
              if(el.distributer === distributer){
                let sorted = [];
                sorted.push(el);
                angular.copy(sorted, myInventoryList);
              }
            })
          })
          return myInventoryList
      },
      getMyInventoryServer: function(dist) {
        $http({
            method: 'GET',
            url: `/distInventory`,
            data: {distributer: dist}
        }).then(function(response){
          console.log('server side query results :', response );
          angular.copy(response.data, myInventoryServer);
        })
        return myInventoryServer;
      },

      // getPages: function(pageNum, perPage){
      //   console.log(eventList);
      //   let start = (pageNum - 1) * perPage;
      //   return eventList.slice(start, start + perPage)
      // },
    };
  }]);
};

},{}],9:[function(require,module,exports){
module.exports = function(app){


app.factory('orderService',['$http', function($http){
 let allOrderList = [];
 let distributerOrderList = [];
 let myOrderList = [];

 return {
   getAllOrders: function(){
     $http({
       method: 'GET',
       url: '/orders',

     }).then(function(response){

         angular.copy(response.data, allOrderList);

     });
     return allOrderList;
   },
   getDistOrders: function(distributer){
     currentDistOrders = [];
     console.log("All Order List inside getdistorders", allOrderList);
     allOrderList.forEach(function(el){
       if (el.distributer === distributer) {
         currentDistOrders.push(el);
       };
       angular.copy(currentDistOrders, distributerOrderList)
     });
     console.log("distributer order list to return", distributerOrderList);
     return distributerOrderList;
   },
   getMyOrders: function(username){
     currentMyOrders = [];
     allOrderList.forEach(function(el){
       if (el.username === username) {
         currentMyOrders.push(el);
       };
       angular.copy(currentMyOrders, myOrderList)
     });
     return myOrderList;
   },
 };


}]);
};

},{}],10:[function(require,module,exports){
module.exports = function(app){


  app.factory('userService',['$http', '$location', function($http, $location){

    let allUsers = [];
    let currentUser = {};

    return{
      login: function(user,pass) {
        $http({
              method: 'GET',
              url: '/users',
          }).then(function(response) {
            console.log("all users", response);
            angular.copy(response.data, allUsers);
              allUsers.forEach(function(el){
                if (el.username === user && el.password === pass) {
                  console.log("users/pass match!");
                  angular.copy(el, currentUser)
                  $location.path('/accounts');
                }
              })
              console.log("not in if statement", currentUser);
              return currentUser;
          })
          // console.log("allsongs arrar", allSongList);
      },
      getCurrentUser: function() {
       console.log("user info", currentUser);
       return currentUser
     },
      getAllUsers: function(){
        $http({
              method: 'GET',
              url: '/users',
          }).then(function(response) {
            console.log("all users", response);
            angular.copy(response.data, allUsers);
          })
          return allUsers
      },

    };
  }]);
};

},{}]},{},[6])