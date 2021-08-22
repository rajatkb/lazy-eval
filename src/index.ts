//
/*
 * -- TODO
 * * lazy Head evaluation
 * * Async API for Concurrent Execution
 * * Generator + Scheduler API for chunked processing of large task list
 * * Operation SKIP when Concrete is available in first step
 * 
 * 
 *  
*/

type EmptyList = null
type Tail = <T>() => LazyList<T> | EmptyList

type TypedTail<T> = () => LazyList<T> | EmptyList

type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;

const empty:EmptyList = null


const lazyValue = <T>(op : () => LazyList<T>|EmptyList ) => {
    let value:LazyList<T> | EmptyList
    return (cb : (v:LazyList<T>|EmptyList) => void) => {
        if(!value){
            value = op()
            cb(value)
        }
        return value
    }
}


class IllegalParameter extends Error{}




/**
 * 
 *
 * @export
 * @class LazyList
 * @extends {Node}
 * @implements {Generator}
 */
export default class LazyList<HType> implements Iterable<HType>{
   

    private tailValueFn:(arg:(v:LazyList<HType>|EmptyList) => void) => LazyList<HType>|EmptyList
    public tailValue:LazyList<HType>|EmptyList = empty



    private constructor( public head:HType , tailOp : TypedTail<HType>){
        this.tailValueFn = lazyValue<HType>(tailOp)
    }

    get tail():LazyList<HType>|EmptyList{
        return this.tailValueFn((v) => this.tailValue = v)
    }


    map<T>(op:(v:HType) => T ):LazyList<T>{
        const node = LazyList.cons(op(this.head) , () => {
            if(!this.tail){
                return empty
            }
            return this.tail.map(op)
        })
        return node
    }

    /**
     * WIP : Should Skip the Operations to the point where tail had concrete values
     * It will skip executing all the functions and jump to the index of currentIndex + count
     * Since concrete value is available here , the list can pick up from here
     *  
     */
    // skip(count:number){

    // }

    filter(op:(v:HType) => boolean):LazyList<HType>| EmptyList{

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

    reduce<A>(op:(acc: A , v:HType , ) => A , seed:A):LazyList<A>{
        seed = op(seed , this.head)
        return LazyList.cons(seed , () => {
            if(!this.tail)
                return empty
            return this.tail?.reduce(op , seed)
        } )
    }

    flat():LazyList<FlatArray<HType , 1>>{

        const head = Array.isArray(this.head) ? <Iterable<FlatArray<HType , 1>>>this.head : [<FlatArray<HType , 1>>this.head] 
        
        return LazyList._fromArray(head , () => {
            if(!this.tail)
                return empty
            return this.tail.flat()
        })
    }

    flatMap<T>(op:(v:HType) => T ):LazyList<FlatArray<T , 1>>{

        const operatedHead = this.map(op).head

        const head = Array.isArray(operatedHead) ? <Iterable<FlatArray<T , 1>>>operatedHead : [<FlatArray<T , 1>>operatedHead] 

        return LazyList._fromArray( head, () => {
            if(!this.tail)
                return empty
            return this.tail.map(op).flat()
        } )
    }

    static cons<T>(value:T , op:TypedTail<T>){
        return new LazyList<T>(value , op)
    }

    private static _fromArray<U , T extends Iterable<U>>(array:T , tailFn: TypedTail<U>):LazyList<U>{
        const darray = Array.isArray(array) ? array : [array]

        if(darray.length === 1){
            return LazyList.cons<U>(darray[0] , tailFn)
        }

        return LazyList.cons(darray[0] , () => {
            return LazyList._fromArray(darray.splice(1 , darray.length) , tailFn)
        })
    }

    static fromArray<T>(array:Array<T>):LazyList<T>{
        return this._fromArray(array , () => empty)
    }

    static fromIterator<T>(iterator:Iterator<T>):LazyList<T>|EmptyList{
        const result = iterator.next()
        if(result.done)
            return empty
        return LazyList.cons(result.value , () => LazyList.fromIterator(iterator))
    }

    

    public takeAll(){
        const iterator = this[Symbol.iterator]()
        const array:HType[] = []
       while(true){
            const result = iterator.next()
            if(result.done)
                break
            array.push(result.value)
        }
        return array
    }

    public forEach(op:(v:HType) => void):LazyList<HType>{
        op(this.head)
        return LazyList.cons(this.head , () => {
            if(!this.tail)
                return empty
            return this.tail?.forEach(op)
        })
    };

    public every(op:<I>(v:I) => boolean):LazyList<boolean>{
        const truthValue = op(this.head)
        return LazyList.cons(truthValue , () => {
            
            if(!this.tail)
                return empty
            if(!truthValue)
                return this.tail.every((v) => false)
            return this.tail?.every((v)=> (op(v) && truthValue))
        })
    }

    public take(max:number):Array<HType>{
        const iterator = this[Symbol.iterator]()
        const array:HType[] = []
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

    public concat<Ctype>(op : LazyList<Ctype> ):LazyList<HType|Ctype>{
        return LazyList.cons(this.head , () => {
            if(!this.tail){
                return op
            }
            return this.tail.concat(op)
        })
    }

    public concatThunk<Ctype>(op : Tail ):LazyList<HType>{
        return LazyList.cons(this.head , () => {
            if(!this.tail){
                return op()
            }
            return this.tail.concatThunk(op)
        })
    }

    *getIterator(){
        let node:LazyList<HType> = this
        while(true){
            yield node.head
            const tailV = node.tail
            if(!tailV){
                break
            }
            node = tailV
        }
    }

    *_getNodeIterator(){
        let node:LazyList<HType> = this
        while(true){
            yield node
            const tailV = node.tail
            if(!tailV){
                break
            }
            node = tailV
        }
    }

    // TODO find way of building generator object out of list

    [Symbol.iterator](){
        return this.getIterator()
    }


    chunk(count:number):LazyList<HType[]>{
        let icount = count
        const values:HType[] = [this.head]
        let tail:LazyList<HType>|null = this.tail
        while(--icount && !!tail){
            values.push(tail.head)
            tail = tail.tail
        }

        return LazyList.cons(values , () => {
            if(!tail)
                return empty
            return tail.chunk(count)
        })
    }


    /**
     * waits on count number of items to be preoduced and awaits on them before returning
     * 
     * WIP : Asynchronous API -- Soon to be included
     *
     * @param {number} count
     * @memberof LazyList
     */
    // join(count:number = 1){
    //     return this.map<Promise<HType>>((v) => Promise.resolve(v)).chunk(count).map(v => Promise.all(v))
    // }


    



}