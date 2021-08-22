import LazyList from "../src"

describe('lazy pattern test' , () => {

    it('test to continue execution on list tail mutation', () => {


        let list1 = LazyList.fromArray([1 ,2 , 3])
        let mlist1 = list1.map(v => v * 2)

        list1.takeAll()
        mlist1.takeAll()

        list1 = list1.concat(mlist1)
        let list3 = list1.map(v => v * 2)

        expect(list3.takeAll().length).toBe(6)

    })

    it('multiple infinite lazy list' , () => {

        let list1:LazyList<number> = LazyList.fromArray([1 , 2 , 3]).concatThunk(() => list1)

        const increment = (i:number):LazyList<number> => {
            return LazyList.cons(i , () => increment(i+1))
        }

        let list2 =  increment(1)

        
        expect(list2.take(30).length).toBe(30)

        expect(list1.take(30).length).toBe(30)

    })

})