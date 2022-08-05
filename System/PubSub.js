const Channels = {
    "KEYDOWN"               : "KEYDOWN",
    "KEYUP"                 : "KEYUP"
};

class PublishSubscribe
{
    constructor()
    {
        this.channels = [];
    }

    Metrics() {
        console.log("Channels: ", this.channels.length);
        for(let channel of this.channels) {
            console.log(`    ${channel.Channel}`);
            console.log(`        ${channel.Subscriptions.length} registered handlers`);
            for(let sub of channel.Subscriptions) {
                console.log(`        ${sub.SubscriberId}`);
            }
        } 
    }

    Subscribe(channelId, subscriberId, callback) {
        const channel = this.getChannel(channelId);
        channel.Subscribe(new PSSubscription(channelId, subscriberId, callback));
        return this;
    }

    SubscribeAll(channelIds, subId, callback) {
        for (const channelId of channelIds)
        {
            const channel = this.getChannel(channelId);
            channel.Subscribe(new PSSubscription(channelId, subId, callback));
        }
        return this;
    }

    Unsubscribe(channelId, subId)
    {
        const channel = this.getChannel(channelId);
        channel.Unsubscribe(new PSSubscription(channelId, subId));
        return this;
    }

    UnsubscribeAll(subId)
    {
        for (let i = 0, len = this.channels.length; i < len; i++)
        {
            const channel = this.channels[i];
            channel.Unsubscribe(new PSSubscription(channel.Channel, subId));
        }
        return this;
    }

    ClearAll()
    {
        this.channels = [];
        return this;
    }

    Publish(to, ...args) {
        const channel = this.getChannel(to);
        if (!channel) {
            throw new Error(`PubSub Channel does not exist. Id: ${to}`);
        }
        channel.Publish(...args);
        return this;
    }

    getChannel(channelId) {
        let channel = this.channels.find(c => c.Channel === channelId);
        if (!channel) {
            channel = new PSChannel(channelId);
            this.channels.push(channel);
        }

        return channel;
    }
}

class PSChannel {
    constructor(channelId)
    {
        this.Channel = channelId;
        this.Subscriptions = [];
    }

    Subscribe(sub) {
        this.Subscriptions.push(sub);
    }

    Unsubscribe(subs) {
        const sub = this.Subscriptions.findIndex(s => s.Channel == subs.Channel && s.SubscriberId == subs.SubscriberId);
        if (sub !== -1)
        {
            this.Subscriptions.splice(sub, 1);
            return true;
        }
        return false;
    }

    Publish(...args)
    {
        for (const i in this.Subscriptions)
        {
            if (!this.Subscriptions.hasOwnProperty(i)) continue; 
            const sub = this.Subscriptions[i];
            if (!sub) continue;
            setTimeout(sub.Callback, 0, ...args);

        }
    }
}

class PSSubscription {
    constructor(channelId, subId, callback)
    {
        this.Channel = channelId,
        this.SubscriberId = subId;
        this.Callback = callback;
    }
}

window.PS = new PublishSubscribe();