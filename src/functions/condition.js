// 解析条件表达式
function parseCondition(condition) {

    const conditions = [];
    const length = condition.length;
    const stack = [];
    stack.unshift(conditions);
    let cursor = 0;
    const catchString = i => {
        const str = condition.substring(cursor, i).trim();
        cursor = i;
        if(str) stack[0].push(str);
    };

    for(let i=0; i<length; i++) {
        switch(condition[i]) {
            case ' ': continue;

            case '(':
                catchString(i);
                cursor ++;
                const sub = [];
                stack[0].push(sub);
                stack.unshift(sub);
                break;

            case ')':
                catchString(i);
                cursor ++;
                stack.shift();
                break;

            case '|':
            case '&':
                catchString(i);
                catchString(i+1);
                break;
            default: continue;
        }
    }

    catchString(length);

    return conditions;
}
//输入属性值和条件原始表达（条件表达式字符串、跳转事件id组成的长度为2的列表），返回true or false
function checkCondition(property, condition) {
    const conditions = parseCondition(condition);
    return checkParsedConditions(property, conditions);
}
//处理&和|串联起来的表达式，返回true or false
function checkParsedConditions(property, conditions) {
    if(!Array.isArray(conditions)) return checkProp(property, conditions);
    if(conditions.length == 0) return true;
    if(conditions.length == 1) return checkParsedConditions(property, conditions[0]);

    let ret = checkParsedConditions(property, conditions[0]);  // 递归一下
    for(let i=1; i<conditions.length; i+=2) {
        switch(conditions[i]) {
            case '&':
                if(ret) ret = checkParsedConditions(property, conditions[i+1]);
                break;
            case '|':
                if(ret) return true;
                ret = checkParsedConditions(property, conditions[i+1]);
                break;
            default: return false;
        }
    }
    return ret;
}
//输入表达式，返回true or false
function checkProp(property, condition) {

    const length = condition.length;
    let i = condition.search(/[><\!\?=]/); //查找运算符位置

    const prop = condition.substring(0,i); // [0, i)区间即为变量名
    const symbol = condition.substring(i, i+=(condition[i+1]=='='?2:1));
    const d = condition.substring(i, length);

    const propData = property.get(prop);  //获取相应变量的值
    const conditionData = d[0]=='['? JSON.parse(d): Number(d);
    //根据运算符分别判断
    switch(symbol) {
        case '>':  return propData >  conditionData;
        case '<':  return propData <  conditionData;
        case '>=': return propData >= conditionData;
        case '<=': return propData <= conditionData;
        case '=':
            if(Array.isArray(propData))
                return propData.includes(conditionData);
            return propData == conditionData;
        case '!=':
            if(Array.isArray(propData))
                return !propData.includes(conditionData);
            return propData == conditionData;
        case '?':
            if(Array.isArray(propData)) {
                for(const p of propData)
                    if(conditionData.includes(p)) return true;
                return false;
            }
            return conditionData.includes(propData);
        case '!':
            if(Array.isArray(propData)) {
                for(const p of propData)
                    if(conditionData.includes(p)) return false;
                return true;
            }
            return !conditionData.includes(propData);

        default: return false;
    }
}

function extractMaxTriggers(condition) {
    // Assuming only age related talents can be triggered multiple times.
    const RE_AGE_CONDITION = /AGE\?\[([0-9\,]+)\]/;
    const match_object = RE_AGE_CONDITION.exec(condition);
    if (match_object == null) {
        // Not age related, single trigger.
        return 1;
    }
    
    const age_list = match_object[1].split(",");
    return age_list.length;
}

export { checkCondition, extractMaxTriggers };