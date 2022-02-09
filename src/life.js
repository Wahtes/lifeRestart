import Property from './property.js';
import Event from './event.js';
import Talent from './talent.js';
import Achievement from './achievement.js';

// 4个主要类在各自的文件中实现
class Life {
    constructor() {
        this.#property = new Property();
        this.#event = new Event();
        this.#talent = new Talent();
        this.#achievement = new Achievement();
    }

    #property;
    #event;
    #talent;
    #achievement;
    #triggerTalents;

    async initial() {
        // 读取json数据
        const [age, talents, events, achievements] = await Promise.all([
          json('age'),
          json('talents'),
          json('events'),
          json('achievement'),
        ])
        this.#property.initial({age});
        this.#talent.initial({talents});
        this.#event.initial({events});
        this.#achievement.initial({achievements});
    }
    // 玩家完成初始数值选择后，进行初始化
    restart(allocation) {
        this.#triggerTalents = {};
        this.#property.restart(allocation);
        this.doTalent();
        this.#property.restartLastStep();
        this.#achievement.achieve(
            this.#achievement.Opportunity.START,
            this.#property
        )
    }

    getTalentAllocationAddition(talents) {
        return this.#talent.allocationAddition(talents);
    }

    getTalentCurrentTriggerCount(talentId) {
        return this.#triggerTalents[talentId] || 0;
    }

    next() {
        const {age, event, talent} = this.#property.ageNext();  //年龄增长

        const talentContent = this.doTalent(talent); //处理天赋中途生效的情况
        const eventContent = this.doEvent(this.random(event));  //TODO 若为列表，对每个都做doEvent

        const isEnd = this.#property.isEnd();
        const content = [talentContent, eventContent].flat(); // 把talentContent, eventContent这两个array合成一个array
        this.#achievement.achieve(
            this.#achievement.Opportunity.TRAJECTORY,
            this.#property
        )
        return { age, content, isEnd };
    }
    // 处理天赋效果 
    doTalent(talents) {
        if(talents) this.#property.change(this.#property.TYPES.TLT, talents);  //中途talent变化
        talents = this.#property.get(this.#property.TYPES.TLT)
            .filter(talentId => this.getTalentCurrentTriggerCount(talentId) < this.#talent.get(talentId).max_triggers);

        const contents = [];
        for(const talentId of talents) {  //一个简写的for循环
            const result = this.#talent.do(talentId, this.#property);
            if(!result) continue;
            this.#triggerTalents[talentId] = this.getTalentCurrentTriggerCount(talentId) + 1;
            const { effect, name, description, grade } = result;
            contents.push({
                type: this.#property.TYPES.TLT,  //声明属性是天赋（与事件区分）
                name,
                grade,
                description,
            })
            if(!effect) continue;
            this.#property.effect(effect);
        }
        return contents;
    }
    // 发生事件
    doEvent(eventId) {
        const { effect, next, description, postEvent } = this.#event.do(eventId, this.#property); //next和postEvent只有一个有，next就是个id！
        this.#property.change(this.#property.TYPES.EVT, eventId);
        this.#property.effect(effect);
        const content = {
            type: this.#property.TYPES.EVT,
            description,
            postEvent,
        }
        //如果有确定要发生的下一事件，在列表中返回
        if(next) return [content, this.doEvent(next)].flat(); //this.doEvent(next)返回[content]，所以最终返回的是元素为content的列表。important：递归doEvent
        return [content];
    }
    // 在当前限制条件下对事件进行随机 Important
    random(events) {
        //筛去不合法的事件
        events = events.filter(([eventId])=>this.#event.check(eventId, this.#property));

        let totalWeights = 0;
        for(const [, weight] of events)
            totalWeights += weight; //总权重

        let random = Math.random() * totalWeights;
        for(const [eventId, weight] of events)
            if((random-=weight)<0)
                return eventId;
        return events[events.length-1]; //返回列表最后一个event
    }
    //一个壳 去看talent.talentRando
    talentRandom() {
        const times = this.#property.get(this.#property.TYPES.TMS);
        const achievement = this.#property.get(this.#property.TYPES.CACHV);
        return this.#talent.talentRandom(this.getLastExtendTalent(), { times, achievement });
    }

    talentExtend(talentId) {
        this.#property.set(this.#property.TYPES.EXT, talentId);
    }
    //从property获得上一局留的talent
    getLastExtendTalent() {
        return this.#property.get(this.#property.TYPES.EXT);
    }

    getSummary() {
        this.#achievement.achieve(
            this.#achievement.Opportunity.SUMMARY,
            this.#property
        )
        return {
            AGE: this.#property.get(this.#property.TYPES.HAGE),
            CHR: this.#property.get(this.#property.TYPES.HCHR),
            INT: this.#property.get(this.#property.TYPES.HINT),
            STR: this.#property.get(this.#property.TYPES.HSTR),
            MNY: this.#property.get(this.#property.TYPES.HMNY),
            SPR: this.#property.get(this.#property.TYPES.HSPR),
            SUM: this.#property.get(this.#property.TYPES.SUM),
        };
    }

    getLastRecord() {
        return this.#property.getLastRecord();
    }

    exclusive(talents, exclusive) {
        return this.#talent.exclusive(talents, exclusive);
    }

    getAchievements() {
        const ticks = {};
        this.#property
            .get(this.#property.TYPES.ACHV)
            .forEach(([id, tick]) => ticks[id] = tick);
        return this
            .#achievement
            .list(this.#property)
            .sort((
                {id: a, grade: ag, hide: ah},
                {id: b, grade: bg, hide: bh}
            )=>{
                a = ticks[a];
                b = ticks[b];
                if(a&&b) return b - a;
                if(!a&&!b) {
                    if(ah&&bh) return bg - ag;
                    if(ah) return 1;
                    if(bh) return -1;
                    return bg - ag;
                }
                if(!a) return 1;
                if(!b) return -1;
            });
    }

    getTotal() {
        const TMS = this.#property.get(this.#property.TYPES.TMS);
        const CACHV = this.#property.get(this.#property.TYPES.CACHV);
        const CTLT = this.#property.get(this.#property.TYPES.CTLT);
        const CEVT = this.#property.get(this.#property.TYPES.CEVT);

        const totalTalent = this.#talent.count();
        const totalEvent = this.#event.count();

        return {
            times: TMS,
            achievement: CACHV,
            talentRate: CTLT / totalTalent,
            eventRate: CEVT / totalEvent,
        }
    }

    get times() { return this.#property?.get(this.#property.TYPES.TMS) || 0; }
    set times(v) {
        this.#property?.set(this.#property.TYPES.TMS, v) || 0;
        this.#achievement.achieve(
            this.#achievement.Opportunity.END,
            this.#property
        )
    }
}

export default Life;

