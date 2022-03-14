function SuperType(name) {
    this.name = name;
    this.colors = ["red","blue","green"];
}

SuperType.prototype.sayName = function() {
    console.log(this.name)
}

function SubType(name,age) {
    SuperType.call(this,name)
    this.age = age
}

SubType.prototype = new SuperType();
SubType.prototype.sayAge = function() {
    console.log(this.age)
}

let instance1 = new SubType("Nich",289)
instance1.colors.push("black")
console.log(instance1.colors)
instance1.sayName()
instance1.sayAge()

let instance2 = new SubType("Gre",27)

console.log(instance2.colors)
instance2.sayName()
instance2.sayAge()

