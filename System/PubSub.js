class PSEventPipe {
}
class PublishSubscribe {
    constructor() {
        this.channels = [];
    }
    Metrics() {
        console.log("Channels: ", this.channels.length);
        for (let channel of this.channels) {
            console.log(`    ${Channel[channel.Channel]}`);
            console.log(`        ${channel.Subscriptions.length} registered handlers`);
            for (let sub of channel.Subscriptions) {
                console.log(`        ${sub.SubscriberId}`);
            }
        }
    }
    Subscribe(channelId, subscriberId, callback) {
        const channel = this.getChannel(channelId);
        channel.Subscribe(new PSSubscription(channelId, subscriberId, callback));
        return this;
    }
    SubscribeAll(channelIds, subscriberId, callback) {
        for (const channelId of channelIds) {
            const channel = this.getChannel(channelId);
            channel.Subscribe(new PSSubscription(channelId, subscriberId, callback));
        }
        return this;
    }
    Unsubscribe(channelId, subscriberId) {
        const channel = this.getChannel(channelId);
        channel.Unsubscribe(new PSSubscription(channelId, subscriberId));
        return this;
    }
    UnsubscribeAll(subscriberId) {
        for (let i = 0; i < this.channels.length; i++) {
            const channel = this.channels[i];
            channel.Unsubscribe(new PSSubscription(channel.Channel, subscriberId));
        }
        return this;
    }
    ClearAll() {
        this.channels = [];
        return this;
    }
    Publish(to, ...args) {
        const channel = this.getChannel(to);
        if (!channel) {
            throw new Error(`PubSubError - Channel must exist. No channel found with id ${Channel[to]}`);
        }
        channel.Publish(...args);
        return this;
    }
    getChannel(channelId) {
        let channel = this.channels.find((c) => c.Channel === channelId);
        if (!channel) {
            channel = new PSChannel(channelId);
            this.channels.push(channel);
        }
        return channel;
    }
}
class PSChannel {
    constructor(channel) {
        this.Channel = channel;
        this.Subscriptions = [];
    }
    Subscribe(subscription) {
        this.Subscriptions.push(subscription);
    }
    Unsubscribe(subscription) {
        const sub = this.Subscriptions.findIndex(s => s.Channel === subscription.Channel && s.SubscriberId === subscription.SubscriberId);
        if (sub !== -1) {
            this.Subscriptions.splice(sub, 1);
            return true;
        }
        else {
            return false;
        }
    }
    Publish(...args) {
        for (const i in this.Subscriptions) {
            if (!this.Subscriptions.hasOwnProperty(i)) {
                continue;
            }
            const sub = this.Subscriptions[i];
            sub.Callback(...args);
        }
    }
}
class PSSubscription {
    constructor(channel, subscriberid, callback) {
        this.SubscriberId = subscriberid;
        this.Channel = channel;
        this.Callback = (callback) ? callback : null;
    }
}
var Channel;
(function (Channel) {
    Channel[Channel["KEYDOWN"] = 0] = "KEYDOWN";
    Channel[Channel["KEYUP"] = 1] = "KEYUP";
    Channel[Channel["DOC_LOADED"] = 2] = "DOC_LOADED";
})(Channel || (Channel = {}));
;
window.PS = new PublishSubscribe();
