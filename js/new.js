function Person(name)  {
    this.name = name
}

Person.prototype.getName = function() {
    return this.name
}

var objectFactory = function() {
    var obj = new Object();
    console.log(arguments);
    var shift = [].shift
    var Constructor = shift.call(arguments);
    obj.__proto__ = Constructor.prototype;
    var ret = Constructor.apply(obj,arguments);
    return typeof ret === "object" ? ret: obj;
}

var a = objectFactory(Person,'sven')
console.log(a.name)
console.log(a.getName())

