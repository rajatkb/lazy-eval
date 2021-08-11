// TODO - Need a Linked list first
/*
   * alla basic stuff done
   ----------------------------
    1. implement array methods
    2. figure out generator exposure
    3. index caching for faster retrieval
*/

type EmptyList = null
type Tail = () => LazyList | EmptyList

const empty:EmptyList = null


const lazyValue = <T>(op : () => T ) => {
    let value:T
    return (cb : (v:T) => void) => {
        if(!value){
            value = op()
            cb(value)
        }
        return value
    }
}




/**
 * Implements the Interfaces required for usage of the Node Class
 *
 * @export
 * @class LazyList
 * @extends {Node}
 * @implements {Generator}
 */
export default class LazyList  {
   

    private tailValueFn: (arg:(v:LazyList|EmptyList) => void) => LazyList|EmptyList
    private _tailValue:LazyList|EmptyList = empty

    private currentValue:LazyList|EmptyList


    private constructor( public head:any , tailOp : Tail){
        this.tailValueFn = lazyValue(tailOp)
        this.currentValue = this
    }

    get tail(){
        return this.tailValueFn((v) => this._tailValue = v)
    }


    

    map(op:(v:any) => any ){
        const node = LazyList.cons(op(this.head) , () => {
            if(!this.tail){
                return empty
            }
            return this.tail.map(op)
        })
        return node
    }

    filter(op:(v:any) => boolean):LazyList | EmptyList{

        const doNext = () => {
            if(!this.tail){
                return empty
            }
            return this.tail.filter(op)
        }

         if(op(this.head)){
             return LazyList.cons(this.head , doNext )
         }else{
            return doNext()
         }
    }

    reduce(op:(acc: any , v:any) => any , seed=null):LazyList{
        seed = op(seed , this.head)
        return LazyList.cons(seed , () => {
            if(!this.tail)
                return empty
            return this.tail?.reduce(op , seed)
        } )
    }

    flat():LazyList{
        return LazyList._fromArray(this.head , () => {
            if(!this.tail)
                return empty
            return this.tail.flat()
        })
    }

    flatMap(op:(v:any) => any ):LazyList{
        return LazyList._fromArray(this.map(op).head , () => {
            if(!this.tail)
                return empty
            return this.tail.map(op).flat()
        } )
    }

    static cons(value:any , op:Tail){
        return new LazyList(value , op)
    }


    // TODO turn this into lazy version as well
    private static _fromArray(array:Array<any> , tailFn: Tail):LazyList{
        array = Array.isArray(array) ? array : [array]

        if(array.length === 1){
            return LazyList.cons(array[0] , tailFn)
        }

        return LazyList.cons(array[0] , () => {
            return LazyList._fromArray(array.splice(1 , array.length) , tailFn)
        })
    }

    static fromArray(array:Array<any>):LazyList{
        return this._fromArray(array , () => empty)
    }

    static fromIterator(iterator:Iterator<any>):LazyList|EmptyList{
        const result = iterator.next()
        if(result.done)
            return empty
        return LazyList.cons(result.value , () => LazyList.fromIterator(iterator))
    }

    

    public takeAll(){
        const iterator = this[Symbol.iterator]()
        const array = []
       while(true){
            const result = iterator.next()
            if(result.done)
                break
            array.push(result.value)
        }
        return array
    }

    public forEach(){

    };

    public take(max:number):Array<any>{
        const iterator = this[Symbol.iterator]()
        const array = []
        for(let i = 0 ; i < max; i++ ){
            const result = iterator.next()
            if(result.done)
                break
            array.push(result.value)
        }
        return array
    }

    public at(i:number){
        const array = this.take(i+1)
        return array[i] 
    }


    public concat(op : Tail ):LazyList{
        return LazyList.cons(this.head , () => {
            if(!this.tail){
                return op()
            }
            return this.tail.concat(op)
        })
    }


    // TODO find way of building generator object out of list

    *[Symbol.iterator](){
        let node:LazyList = this
        while(true){
            yield node.head
            const tailV = node.tail
            if(!tailV){
                break
            }
            node = tailV
        }
    }



}