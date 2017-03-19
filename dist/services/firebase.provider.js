angular.module('provider.firebase', [
    'service.data'
])
    .provider('$firebaseService', function FirebaseServiceProvider() {

        this.Service = {};
        this.Providers = {};

        // @IMPORTANT MUST be independent of $rideStorage        
        function FirebaseService($all, $firebase, $providers, $store) {
            console.log('$firebaseService');
            console.warn('Firebase ready? %o', (typeof $firebase === 'object' && $firebase.facebookProvider !== undefined));

            var _ = {
                Service: $firebase,
                providers: function (name) {
                    return $providers;
                },
                provider: function (name) {
                    if (!name) return;
                    switch (name.toLowerCase()) {
                        case 'fb':
                        case 'facebook':
                            return $providers.Facebook;
                    }
                },
                write: function (path, valueStruct, dataIsPrivate) {
                    // get current user
                    var currentUser = $firebase.auth().currentUser;
                    if (!currentUser) {
                        console.error('No firebase user available! Aborting write to database.');
                        return;
                    }
                    // compose path for data update 
                    var refPath = dataIsPrivate ? ['users', currentUser.uid, path].join('/') : (path || ['temp', 'sessions', currentUser.uid].join('/'));
                    console.warn('Starting save to path: %s', refPath);
                    // write back data update, and return promise
                    return $firebase.database()
                        .ref(refPath)
                        .set(valueStruct)
                        /*
                        .then(function () {
                            console.info('Data saved @%s: %o', refPath, arguments);
                        })
                        */
                        ;
                },
                saveFile: function (path, name, buffer) {
                    return new Promise(function (resolve, reject) {
                        // create root reference
                        var storeRef = $firebase.storage().ref();
                        // create specific file reference 
                        var fileRef = storeRef.child([path, name].join('/'));
                        var task = fileRef.put(buffer);
                        task.on('state_changed',
                            function progress(snapshot) {
                                // Observe state change events such as progress, pause, and resume
                                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                console.log('Upload is ' + progress + '% done');
                                switch (snapshot.state) {
                                    case firebase.storage.TaskState.PAUSED: // or 'paused'
                                        console.log('Upload is paused');
                                        break;
                                    case firebase.storage.TaskState.RUNNING: // or 'running'
                                        console.log('Upload is running');
                                        break;
                                }
                            },
                            function errorHandler(error) {
                                return reject(error);
                            },
                            function complete() {
                                // get download URL 
                                task.snapshot.downloadURL;
                                // resolve
                                return resolve(task.snapshot);
                            })
                            ;
                    });
                }
            };

            // Housekeeping here
            $firebase.auth().onAuthStateChanged(function (user) {
                console.warn('Firebase user: %o', user);
                // send signals that firebase is ready, and authenticated
                $all.$broadcast('firebase:ready', user);
                $all.$broadcast('firebase:authChanged', user);
                // save firebase user
                $store.set('firebaseUser', user);
                // apply any changes to UI
                if (!$all.$$phase) $all.$apply();
            });

            return _;

        };

        this.$get = ["$rootScope", "$instanceStorage", function authServiceFactory($rootScope, nameSpacedStorage) {
            var _this = this;
            // initialize the factory
            return new FirebaseService($rootScope, _this.Service, _this.Providers, nameSpacedStorage);
        }];

    });