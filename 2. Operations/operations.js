/*

Arithamtic Operations:
    1. Addition (+)
    2. Subtraction (-)
    3. Multiplication (*)
    4. Division (/)
    5. Modulus (%)
    6. Exponentiation (**)
    7. Increment (++)
    8. Decrement (--)

*/

let a = 10
let b = 3

console.log("Arithamtic Operations:")
console.log("\n")

console.log("Addition: ", a + b)
console.log("Subtraction: ", a - b)
console.log("Multiplication: ", a * b)
console.log("Division: ", (a / b).toFixed(2)) // toFixed is used to limit number of digits after decimal
console.log("Modulus: ", a % b)
console.log("Exponentiation: ", a ** b) 

console.log("Increment: ", ++a)
console.log("Decrement: ", --a)

console.log("\n")
/*

Comparison Operations:
    1. Equal to (==)
    2. Not Equal to (!=)
    3. Strict Equal to (===)
    4. Strict Not Equal to (!==)
    5. Greater than (>)
    6. Less than (<)
    7. Greater than or Equal to (>=)
    8. Less than or Equal to (<=)

*/
console.log("Comparison Operations:")
console.log("\n")

a = 1
b = '1'

console.log("Equal to: ", a == b)
console.log("Not Equal to: ", a != b)
console.log("Strict Equal to: ", a === b)
console.log("Strict Not Equal to: ", a !== b)
console.log("Greater than: ", a > b)
console.log("Less than: ", a < b)
console.log("Greater than or Equal to: ", a >= b)
console.log("Less than or Equal to: ", a <= b)
