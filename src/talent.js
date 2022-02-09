import { clone } from './functions/util.js';
import { checkCondition, extractMaxTriggers } from './functions/condition.js';
import { getRate } from './functions/addition.js';

class Talent {
    constructor() {}

    #talents;

    initial({talents}) {
        this.#talents = talents;
        for(const id in talents) {
            const talent = talents[id];
            talent.id= Number(id);
            talent.grade = Number(talent.grade);
            talent.max_triggers = extractMaxTriggers(talent.condition);
        }
    }

    count() {
        return Object.keys(this.#talents).length;
    }

    check(talentId, property) {
        const { condition } = this.get(talentId);
        return checkCondition(property, condition);
    }

    get(talentId) {  //根据talentId获取对应的talent
        const talent = this.#talents[talentId];
        if(!talent) throw new Error(`[ERROR] No Talent[${talentId}]`);
        return clone(talent);
    }

    information(talentId) {
        const { grade, name, description } = this.get(talentId)
        return { grade, name, description };
    }

    exclusive(talends, exclusiveId) {
        const { exclusive } = this.get(exclusiveId);
        if(!exclusive) return null;
        for(const talent of talends) {
            for(const e of exclusive) {
                if(talent == e) return talent;
            }
        }
        return null;
    }
    // important 抽取天赋
    talentRandom(include, {times = 0, achievement = 0} = {}) {
        const rate = { 1:100, 2:10, 3:1, }; //三种等级概率，单位为千分之一（‰）
        const rateAddition = { 1:1, 2:1, 3:1, };
        const timesRate = getRate('times', times);
        const achievementRate = getRate('achievement', achievement);

        for(const grade in timesRate)
            rateAddition[grade] += timesRate[grade] - 1;

        for(const grade in achievementRate)
            rateAddition[grade] += achievementRate[grade] - 1;

        for(const grade in rateAddition) //乘以对应的rateAddition
            rate[grade] *= rateAddition[grade];

        const randomGrade = () => { 
            let randomNumber = Math.floor(Math.random() * 1000);//和random() * 1000比大小
            if((randomNumber -= rate[3]) < 0) return 3;
            if((randomNumber -= rate[2]) < 0) return 2;
            if((randomNumber -= rate[1]) < 0) return 1;
            return 0;
        }

        // 1000, 100, 10, 1
        const talentList = {};
        for(const talentId in this.#talents) {  //遍历所有天赋，按grade填到talentList里去
            const { id, grade, name, description } = this.#talents[talentId];
            if(id == include) {
                include = { grade, name, description, id };
                continue;
            }
            if(!talentList[grade]) talentList[grade] = [{ grade, name, description, id }];
            else talentList[grade].push({ grade, name, description, id });
        }

        return new Array(10)
            .fill(1).map((v, i)=>{
                //看上去会执行10遍，直到填充完
                if(!i && include) return include;  //先填上局留下的
                let grade = randomGrade();
                while(talentList[grade].length == 0) grade--;  //如果这个稀有度的用完了，那就选次稀有的，直到长度不为0
                const length = talentList[grade].length;
                //在talentList[grade]中随机取一个
                const random = Math.floor(Math.random()*length) % length; 
                return talentList[grade].splice(random,1)[0];
            });
    }

    allocationAddition(talents) {
        if(Array.isArray(talents)) {
            let addition = 0;
            for(const talent of talents)
                addition += this.allocationAddition(talent);
            return addition;
        }
        return Number(this.get(talents).status) || 0;
    }

    do(talentId, property) {  //对外（Life类）展示的处理天赋事件的接口
        const { effect, condition, grade, name, description } = this.get(talentId);
        if(condition && !checkCondition(property, condition))
            return null;
        return { effect, grade, name, description };
    }
}

export default Talent;