angular.module('larcity-constants', [])
    .constant("Constants", {
        Event: {
            Auth: {
                REQUIRED: 'app:auth:loginRequired',
                LOGIN_CONFIRMED: 'app:auth:loginConfirmed',
                LOGIN_CANCELED: 'app:auth:loginCanceled'
            }
        },
        Permission: {
            GEOLOCATION: 'permission.geolocation'
        }
    });