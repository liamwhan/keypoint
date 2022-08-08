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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHViU3ViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUHViU3ViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVdBLE1BQWUsV0FBVztDQUV6QjtBQUtELE1BQU0sZ0JBQWdCO0lBSWxCO1FBQ0ksSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVNLE9BQU87UUFDVixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hELEtBQUksSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLE9BQU8sQ0FBQyxhQUFhLENBQUMsTUFBTSxzQkFBc0IsQ0FBQyxDQUFDO1lBQzNFLEtBQUksSUFBSSxHQUFHLElBQUksT0FBTyxDQUFDLGFBQWEsRUFBRTtnQkFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2FBQzlDO1NBQ0o7SUFFTCxDQUFDO0lBTU0sU0FBUyxDQUFDLFNBQWtCLEVBQUUsWUFBb0IsRUFBRSxRQUFvQjtRQUV2RSxNQUFNLE9BQU8sR0FBYyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RELE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxjQUFjLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBRTdFLE9BQU8sSUFBSSxDQUFDO0lBRWhCLENBQUM7SUFNTSxZQUFZLENBQUMsVUFBcUIsRUFBRSxZQUFvQixFQUFFLFFBQW9CO1FBQ2pGLEtBQUssTUFBTSxTQUFTLElBQUksVUFBVSxFQUFFO1lBRTVCLE1BQU0sT0FBTyxHQUFj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