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


    /**
     * Converts the `head` data to
     * target using `op`
     *
     * @template T
     * @param {(v:HType) => T} op
     * @return {*}  {LazyList<T>}
     * @memberof LazyList
     */
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

    /**
     * `filter` nodes and return the `head` for the filtered nodes
     *
     * @param {(v:HType) => boolean} op
     * @return {*}  {(LazyList<HType>| EmptyList)}
     * @memberof LazyList
     */
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

    /**
     *
     * Returns the `accumulator - seed` result for each pass of access to `next element`
     * in the list. Useful for accumulating result into the seed 
     * 
     *
     * @template A
     * @param {(acc: A , v:HType , ) => A} op
     * @param {A} seed
     * @return {*}  {LazyList<A>}
     * @memberof LazyList
     */
    reduce<A>(op:(acc: A , v:HType , ) => A , seed:A):LazyList<A>{
        seed = op(seed , this.head)
        return LazyList.cons(seed , () => {
            if(!this.tail)
                return empty
            return this.tail?.reduce(op , seed)
        } )
    }

    /**
     * take `arrays from op` and flatten it
     * `op` can return primitive array.
     *
     * @return {*}  {LazyList<FlatArray<HType , 1>>}
     * @memberof LazyList
     */
    flat():LazyList<FlatArray<HType , 1>>{

        const head = Array.isArray(this.head) ? <Iterable<FlatArray<HType , 1>>>this.head : [<FlatArray<HType , 1>>this.head] 
        
        return LazyList._fromArray(head , () => {
            if(!this.tail)
                return empty
            return this.tail.flat()
        })
    }

    /**
     * take `head` value takes `array from op` or `value fromr op`
     * and `flatten` it
     * 
     *
     * @template T
     * @param {(v:HType) => T} op
     * @return {*}  {LazyList<FlatArray<T , 1>>}
     * @memberof LazyList
     */
    flatMap<T>(op:(v:HType) => T ):LazyList<FlatArray<T , 1>>{

        const operatedHead = this.map(op).head

        const head = Array.isArray(operatedHead) ? <Iterable<FlatArray<T , 1>>>operatedHead : [<FlatArray<T , 1>>operatedHead] 

        return LazyList._fromArray( head, () => {
            if(!this.tail)
                return empty
            return this.tail.map(op).flat()
        } )
    }

    /**
     * Contructor for creating the LazyList
     *
     * @static
     * @template T
     * @param {T} value
     * @param {TypedTail<T>} op
     * @return {*} 
     * @memberof LazyList
     */
    static cons<T>(value:T , op:TypedTail<T>){
        return new LazyList<T>(value , op)
    }

    /**
     * Create LazyLIst from an Array
     *
     * @private
     * @static
     * @template U
     * @template T
     * @param {T} array
     * @param {TypedTail<U>} tailFn
     * @return {*}  {LazyList<U>}
     * @memberof LazyList
     */
    private static _fromArray<U , T extends Iterable<U>>(array:T , tailFn: TypedTail<U>):LazyList<U>{
        const darray = Array.isArray(array) ? array : [array]

        if(darray.length === 1){
            return LazyList.cons<U>(darray[0] , tailFn)
        }

        return LazyList.cons(darray[0] , () => {
            return LazyList._fromArray(darray.splice(1 , darray.length) , tailFn)
        })
    }

    /**
     * create LazyList from array
     *
     * @static
     * @template T
     * @param {Array<T>} array
     * @return {*}  {LazyList<T>}
     * @memberof LazyList
     */
    static fromArray<T>(array:Array<T>):LazyList<T>{
        return this._fromArray(array , () => empty)
    }

    /**
     * Create Lazy list from Iterator
     *
     * @static
     * @template T
     * @param {Iterator<T>} iterator
     * @return {*}  {(LazyList<T>|EmptyList)}
     * @memberof LazyList
     */
    static fromIterator<T>(iterator:Iterator<T>):LazyList<T>|EmptyList{
        const result = iterator.next()
        if(result.done)
            return empty
        return LazyList.cons(result.value , () => LazyList.fromIterator(iterator))
    }

    

    
    /**
     * return the resolved laay list as an array
     * `note:` `can lead to execution of the array endlessly and block main thread
     *
     * @return {*}  {HType[]}
     * @memberof LazyList
     */
    public takeAll():HType[]{
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

    /**
     * `taps` into the execution and can pick data from between execution
     * good place to do SideEffect operations
     *
     * @param {(v:HType) => void} op
     * @return {*}  {LazyList<HType>}
     * @memberof LazyList
     */
    public forEach(op:(v:HType) => void):LazyList<HType>{
        op(this.head)
        return LazyList.cons(this.head , () => {
            if(!this.tail)
                return empty
            return this.tail?.forEach(op)
        })
    };

    /**
     * returns `truthy value` for every LazyList node satisfying the `op`
     *
     * @param {<I>(v:I) => boolean} op
     * @return {*}  {LazyList<boolean>}
     * @memberof LazyList
     */
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

    /**
     * take `count` of `node` from `LazyList` and returns the list
     *
     * @param {number} max
     * @return {*}  {Array<HType>}
     * @memberof LazyList
     */
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

    /**
     * Gives the `head` value at position
     * `note:` For infinite list this can block thread for long time
     * 
     *
     * @param {number} index
     * @return {*} 
     * @memberof LazyList
     */
    public valueAt(index:number){
        const array = this.take(index+1)
        return array[index]
    }

    /**
     * Gives the `node` at position
     * `note:` For infinite list this can block thread for long time
     *
     * @param {number} index
     * @return {*}  {(LazyList<HType>|undefined)}
     * @memberof LazyList
     */
    public nodeAt(index:number):LazyList<HType>|undefined{
        const nodeIterator = this.getNodeIterator()
        let value
        for(let i = 0 ; i <=index ; i++ ){
            const result = nodeIterator.next()
            if(result.done)
                break
            value = result.value
        }
        return value
    }



    /**
     * Concats a LazyList instance at the end of list of another list
     *
     * @template Ctype
     * @param {LazyList<Ctype>} op
     * @return {*}  {(LazyList<HType|Ctype>)}
     * @memberof LazyList
     */
    public concat<Ctype>(op : LazyList<Ctype> ):LazyList<HType|Ctype>{
        return LazyList.cons(this.head , () => {
            if(!this.tail){
                return op
            }
            return this.tail.concat(op)
        })
    }

    /**
     * Concats a LazyList creator at the end of list of another list
     *
     * @template Ctype
     * @param {TypedTail<Ctype>} op
     * @return {*}  {(LazyList<HType|Ctype>)}
     * @memberof LazyList
     */
    public concatThunk<Ctype>(op : TypedTail<Ctype> ):LazyList<HType|Ctype>{
        return LazyList.cons(this.head , () => {
            if(!this.tail){
                return op()
            }
            return this.tail.concatThunk(op)
        })
    }

    /**
     * returns a usable iterator for the current LazyList head
     *
     * @memberof LazyList
     */
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

    /**
     * returns a usable for the curreny LazyList Node
     *
     * @memberof LazyList
     */
    *getNodeIterator(){
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


    /**
     * Creates chunks of list elements in `count` length
     * each chunk operation greedily consumes the List until count is matched
     * to return a ` LazyList Node<Array[count]>`
     * 
     * Can be used to break up execution and batch the same
     *
     * @param {number} count
     * @return {*}  {LazyList<HType[]>}
     * @memberof LazyList
     */
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