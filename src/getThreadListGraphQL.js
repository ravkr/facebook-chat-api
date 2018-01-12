"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function(defaultFuncs, api, ctx) {
  return function getThreadListGraphQL(limit, timestamp, callback) {
    if(!callback) {
      throw {error: "getThreadListGraphQL: need callback"};
    }

    var form = {
      "queries": JSON.stringify({
        "o0":{
          // This doc_id was valid on 2018-01-12.
          "doc_id":"1349387578499440",
          "query_params":{
            "limit": limit,
            "before": timestamp,
            "tags":["INBOX"],
            "includeDeliveryReceipts": true,
            "includeSeqID": false
          }
        }
      })
    };
    defaultFuncs
      .post("https://www.facebook.com/api/graphqlbatch/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function(resData) {
        if (resData.error) {
          throw resData;
        }
        callback(null, resData)
        // This returns us an array of things. The last one is the success /
        // failure one.
        // @TODO What do we do in this case?
        /*if (resData[resData.length - 1].error_results !== 0) {
          throw new Error("well darn there was an error_result")
        }

        callback(null, formatMessagesGraphQLResponse(resData[0]));*/
      })
      .catch(function(err) {
        log.error("getThreadListGraphQL", err);
        return callback(err);
      });
  };
};
