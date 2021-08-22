import LazyList from '../src'

describe('lazy initialization test' , () => {
    it('lazy init', () => {

        const list = LazyList.fromArray([1 , 2 , 3 , 4 , 5])
        expect(list.tailValue).toBeNull()
    })

    it('lazy for each' , () => {
        let i = 0
        
        const list = LazyList.fromArray([1 , 2 , 3, 4 , "5"]).forEach((v) => {
            i++
        })

        expect(i).toBe(1)
        
        list.takeAll()

        expect(i).toBe(5)
    })

    it('lazy map' , () => {
        let i = 0
        const list = LazyList.fromArray([1 , 2, 3 , 4 , 5]).map(v => {
            i++
            return v * 2
        })

        expect(i).toBe(1)
        
        list.takeAll()

        expect(i).toBe(5)

    })

    it('lazy map + flat evaluation ' , () => {
        let i = 0

        const list = LazyList.fromArray([1 , 2, 3 , 4 , 5]).map(v => {
            i++
            return v * 2
        })

        expect(i).toBe(1)
        
        list.takeAll()

        expect(i).toBe(5)

        const work = list.map(v => {
            return [v , v , v]
        }).flat().takeAll()

        expect(work.length === 5 * 3).toBeTruthy()
        expect(i).toBe(5)
    })


    it('lazy map + flat  + flatmap + reduce evaluation' , () => {
        
        const list = LazyList.fromArray([1 , 2, 3 , 4 , 5])
                    .map(v => v * 2)
                    .flatMap(v => v + 3)
                    .reduce( (acc , v) => acc * v , 13)
        
        expect(list.tailValue).toBeNull()
        
        expect(list.takeAll().length).toBe(5)

    })

    it('concat test' , () => {
        const list = LazyList.fromArray([1 , 2]).concat(LazyList.fromArray([3 , 4])).concat(LazyList.fromArray([5]))
        
        expect(list.takeAll().length).toBe(5)

    })

    it('chunk test' , () => {

        const list = LazyList.fromArray([1 , 2, 3 , 4 , 5])
                    .map(v => v * 2)
                    .flatMap(v => v + 3)
                    .reduce( (acc , v) => acc * v , 13).chunk(2)
        
        expect(list.head.length).toBe(2)
        expect(list.tailValue).toBe(null)

    })


    


})