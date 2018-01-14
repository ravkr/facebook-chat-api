"use strict";

var utils = require("../utils");
var log = require("npmlog");

function formatParticipants(participants) {
  return participants.nodes.map((p)=>{
    p = p.messaging_actor;
    console.log(p.messaging_actor);
    return {
      userID: p.id,
      name: p.name,
      shortName: p.short_name,
      gender: p.gender, // MALE, FEMALE
      url: p.url, // how about making it profileURL
      profilePicture: p.big_image_src.uri,
      username: p.username,
      // TODO: maybe better names for these?
      isViewerFriend: p.is_viewer_friend, // true/false
      isMessengerUser: p.is_messenger_user, // true/false
      isVerified: p.is_verified, // true/false
      isMessageBlockedByViewer: p.is_message_blocked_by_viewer, // true/false
      isViewerCoworker: p.is_viewer_coworker, // true/false
      isEmployee: p.is_employee // null? when it is something other? can someone check?
    };
  });
}

function formatThreadList(data) {
  return data.map((t) => {
    return {
      threadID: t.thread_key.thread_fbid || t.thread_key.other_user_id,
      name: t.name,
      // lastMessage: t.last_message, // TODO
      unreadCount: t.unread_count,
      messageCount: t.messages_count,
      imageSrc: t.image?t.image.uri:null,
      emoji: t.customization_info?t.customization_info.emoji:null,
      color: t.customization_info?t.customization_info.outgoing_bubble_color:null, // TODO: what to return? "FF8C0077" or null
      nicknames: t.customization_info?t.customization_info.participant_customizations.map((u) => { return {"userID": u.participant_id, "nickname": u.nickname }; }):[],
      muteUntil: t.mute_until,
      participants: formatParticipants(t.all_participants),
      folder: t.folder, // "INBOX" or...?
      // : t.,
      threadType: t.thread_type, // "GROUP" or "ONE_TO_ONE"
      // rtc_call_data: t.rtc_call_data, // TODO: format and document this
      // adminIDs: t.thread_admins, // feature from future? it is always an empty array - for more than a year (2018-01-14)
      // isPinProtected: t.is_pin_protected, // feature from future? always false (2018-01-14)
      // customizationEnabled: t.customization_enabled; // TODO: always true? (was true even when customization_info was null) (2018-01-14)
    }
  })
}

function formatThread(data) {
  return {
    // threadID: formatID(data.thread_fbid.toString()),
    // participants: data.participants.map(formatID),
    participantIDs: data.participants.map(formatID),
    // name: data.name,
    // nicknames: data.custom_nickname,
    snippet: data.snippet,
    snippetAttachments: data.snippet_attachments,
    snippetSender: formatID((data.snippet_sender || '').toString()),
    // unreadCount: data.unread_count,
    // messageCount: data.message_count,
    // imageSrc: data.image_src,
    timestamp: data.timestamp,
    serverTimestamp: data.server_timestamp, // what is this?
    // muteUntil: data.mute_until,
    isCanonicalUser: data.is_canonical_user,
    isCanonical: data.is_canonical,
    isSubscribed: data.is_subscribed,
    // folder: data.folder,
    isArchived: data.is_archived,
    recipientsLoadable: data.recipients_loadable,
    hasEmailParticipant: data.has_email_participant,
    readOnly: data.read_only,
    canReply: data.can_reply,
    cannotReplyReason: data.cannot_reply_reason,
    lastMessageTimestamp: data.last_message_timestamp,
    lastReadTimestamp: data.last_read_timestamp,
    lastMessageType: data.last_message_type,
    // emoji: data.custom_like_icon,
    color: data.custom_color,
    // adminIDs: data.admin_ids,
    // threadType: data.thread_type
  };
}

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
        // callback(null, resData[0].o0.data.viewer.message_threads.nodes)
        callback(null, formatThreadList(resData[0].o0.data.viewer.message_threads.nodes));
        // This returns us an array of things. The last one is the success /
        // failure one.
        // @TODO What do we do in this case?
        /*if (resData[resData.length - 1].error_results !== 0) {
          throw new Error("well darn there was an error_result")
        }

        callback(null, formatListGraphQLResponse(resData[0]));*/
      })
      .catch(function(err) {
        log.error("getThreadListGraphQL", err);
        return callback(err);
      });
  };
};
