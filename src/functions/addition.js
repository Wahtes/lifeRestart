// 获得稀有度
export function getRate(type, value) {
    switch(type) {
        case 'times':
            if(value >= 100) return {2:6};
            if(value >= 70) return {2:5};
            if(value >= 50) return {2:4};
            if(value >= 30) return {2:3};
            if(value >= 10) return {2:2};
            return {2: 1};
        case 'achievement':
            if(value >= 100) return {3:6};
            if(value >= 70) return {3:5};
            if(value >= 50) return {3:4};
            if(value >= 30) return {3:3};
            if(value >= 10) return {3:2};
            return {3:1};
        default: return {};
    }
}
// 获得属性分数评级（人生总结时）
export function getGrade(type, value) {
    switch(type) {
        case 'times':
        case 'achievement':
            if(value >= 100) return 3;
            if(value >= 50) return 2;
            if(value >= 10) return 1;
            return 0;
        case 'talentRate':
            if(value >= 0.9) return 3;
            if(value >= 0.6) return 2;
            if(value >= 0.3) return 1;
            return 0;
        case 'eventRate':
            if(value >= 0.6) return 3;
            if(value >= 0.4) return 2;
            if(value >= 0.2) return 1;
            return 0;
        default: return 0;
    }
}