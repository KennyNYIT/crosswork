"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const memcached = require("memcached");
const util = require("util");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const MAX_EXPIRATION = 60 * 60 * 24 * 30;
const memcachedClient = new memcached(`${process.env.ENDPOINT}:${process.env.PORT}`);
exports.chargeRequestMemcached = async function (input) {
    var data = await getBalanceMemcached(KEY);
    var remainingBalance = Number(data[KEY]);
    const charges = getCharges();
    const isAuthorized = authorizeRequest(remainingBalance, charges);
    if (!authorizeRequest(remainingBalance, charges)) {
        return {
            remainingBalance,
            isAuthorized,
            charges: 0,
        };
    }
    var newBalance = remainingBalance-charges;
    remainingBalance = await chargeMemcached(KEY, data.cas, newBalance);
    return {
        remainingBalance,
        charges,
        isAuthorized,
    };
};

function authorizeRequest(remainingBalance, charges) {
    return remainingBalance >= charges;
}
function getCharges() {
    return DEFAULT_BALANCE / 20;
}

async function getBalanceMemcached(key) {
    return new Promise((resolve, reject) => {
        memcachedClient.gets(key, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}

function chargeMemcached(key, cas, newBalance) {
    return new Promise((resolve, reject) => {
        memcachedClient.cas(key, Number(newBalance),cas,MAX_EXPIRATION ,(err, result) => {
        if (err) {
            console("err:"+err);
            reject(err);
        }
        else {
            return resolve(Number(newBalance));
        }
        });  
    
      
        
    });
}
