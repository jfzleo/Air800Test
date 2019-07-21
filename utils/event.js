// var event = (function() {
//   var events = {};
//     return {
//       register(name, self, callback) {
//         var tuple = [self, callback];
//         var callbacks = events[name];
//         if (Array.isArray(callbacks)) {
//           callbacks.push(tuple);
//         } else {
//           events[name] = [tuple];
//         }
//         console.log("register", callbacks);
//       },
//       unregister(name, self) {
//         var callbacks = events[name];
//         if (Array.isArray(callbacks)) {
//           events[name] = callbacks.filter((tuple) => {
//             return tuple[0] != self;
//           })
//         }
//       },
//       post(name, data) {
//         var callbacks = events[name];
//         console.log("post", callbacks);
//         if (Array.isArray(callbacks)) {
//           callbacks.map((tuple) => {
//             var self = tuple[0];
//             var callback = tuple[1];
//             callback.call(self, data);
//           })
//         }
//       }
//    }
// })();

// export {event};

var events = {};
function register(name, self, callback) {
  var tuple = [self, callback];
  var callbacks = events[name];
  if (Array.isArray(callbacks)) {
    callbacks.push(tuple);
  } else {
    events[name] = [tuple];
  }
}

function unregister(name, self) {
  var callbacks = events[name];
  if (Array.isArray(callbacks)) {
    events[name] = callbacks.filter((tuple) => {
      return tuple[0] != self;
    })
  }
}

function post(name, data) {
  var callbacks = events[name];
  if (Array.isArray(callbacks)) {
    callbacks.map((tuple) => {
      var self = tuple[0];
      var callback = tuple[1];
      callback.call(self, data);
    })
  }
}

export {register, unregister, post};