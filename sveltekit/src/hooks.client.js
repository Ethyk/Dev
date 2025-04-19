// src/hooks.client.js
if (typeof crypto.randomUUID !== 'function') {
    crypto.randomUUID = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  }
  
  // Tu peux laisser le reste vide si tu n’as pas de hooks à exporter
  