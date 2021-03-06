// Generated by LiveScript 1.5.0
(function(){
  define(function(require){
    var Path, cloneToJson;
    Path = require('../Path');
    cloneToJson = require('../utils/cloneToJson');
    return function(sup, template, field){
      function ractivePath(path){
        if (path) {
          return field + "." + Path.parse(path).join(".");
        } else {
          return field;
        }
      }
      template.set(field, cloneToJson(sup.object));
      return sup.subscribe({
        mod: function(path, value){
          return template.set(ractivePath(path), cloneToJson(value));
        },
        add: function(path, value){
          return template.push(ractivePath(path), cloneToJson(value));
        },
        del: function(path){
          var parts, index, arrayPath;
          parts = Path.parse(path);
          index = parts.pop();
          arrayPath = ractivePath(Path.build(parts));
          return template.splice(arrayPath, index, 1);
        },
        merge: function(path, values){
          var json, parts, key, value, results$ = [];
          json = cloneToJson(values);
          parts = Path.parse(path);
          for (key in json) {
            value = json[key];
            path = Path.build(parts.concat(key));
            results$.push(template.set(ractivePath(path), cloneToJson(value)));
          }
          return results$;
        }
      });
    };
  });
}).call(this);
