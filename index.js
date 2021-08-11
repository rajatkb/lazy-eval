const util = require('util')

const LazyList = require('./dist/cjs').default


const array = LazyList.fromArray([1,  2, 3, 4 , 5 , 6 , 7])

const array2 = array.map((v) => {
    console.log(`fire : ${v}`)
    return v * 2
}).reduce((acc , v) => {
    return acc + v
}, 0).map((v) => {
    return v * 3
})



console.log(array2.take(30))
console.log(util.inspect(array2, false, null, true /* enable colors */))






