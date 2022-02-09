import { clone } from './functions/util.js';
import { checkCondition } from './functions/condition.js';

class Event {
    constructor() {}

    #events;

    initial({events}) {
        this.#events = events;
        for(const id in events) {
            const event = events[id];
            if(!event.branch) continue;
            // branch是列表，列表中每一项格式如EVT?[10382,20367]:10403
            event.branch = event.branch.map(b=>{ 
                b = b.split(':');  //在:处分开
                b[1] = Number(b[1]); //跳转到的事件id改为Number类型  TODO：改为支持事件序号列表
                return b;
            });
        }
    }

    count() {
        return Object.keys(this.#events).length;
    }
    //检查合法性，在life中作为filter
    check(eventId, property) {
        const { include, exclude, NoRandom } = this.get(eventId);
        if(NoRandom) return false;  //NoRandom的event不参与随机
        if(exclude && checkCondition(property, exclude)) return false;
        if(include) return checkCondition(property, include);
        return true;
    }

    get(eventId) {
        const event = this.#events[eventId];
        if(!event) throw new Error(`[ERROR] No Event[${eventId}]`);
        return clone(event);
    }

    information(eventId) {
        const { event: description } = this.get(eventId)
        return { description };
    }

    do(eventId, property) {
        const { effect, branch, event: description, postEvent } = this.get(eventId); //javaScript语法，直接将对象相应属性取出（key相同）
        if(branch) //important如果有分支情况
            for(const [cond, next] of branch) //依次处理每一分支情况 
                if(checkCondition(property, cond)) //如果满足所描述的条件
                    return { effect, next, description }; //直接返回对应的事件（不看后面的分支），保存在next。不返回postEvent！
        return { effect, postEvent, description };   //这里的变量名和接受参数方是一一对应的
    }

}

export default Event;