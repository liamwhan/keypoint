interface Window {
    PS: PublishSubscribe;
}    

type IPSHandler = (...args: any[]) => void;
type IPSReceiverListener = (req: any) => any;
interface IPSReceiver {
    listener: IPSReceiverListener;
}


abstract class PSEventPipe {
    protected abstract setupEventPipe(): void;
}

/**
 * PubSub Base class
 */
class PublishSubscribe {

    private channels: PSChannel[];
    
    constructor() {
        this.channels = [];
    }

    public Metrics(): void {
        console.log("Channels: ", this.channels.length);
        for(let channel of this.channels) {
            console.log(`    ${Channel[channel.Channel]}`);
            console.log(`        ${channel.Subscriptions.length} registered handlers`);
            for(let sub of channel.Subscriptions) {
                console.log(`        ${sub.SubscriberId}`);
            }
        }

    }

    /**
     * Subscribe to the channel specified by channelId, registering an event handler.
     * Notes: Creates a channel if it doesnt exist
     */
    public Subscribe(channelId: Channel, subscriberId: string, callback: IPSHandler): this {
        // setTimeout(() => {
            const channel: PSChannel = this.getChannel(channelId);
            channel.Subscribe(new PSSubscription(channelId, subscriberId, callback));
        // }, 0);
        return this;

    }

    /**
     * Subscribes to all of the channels specified by channelIds, registering a single event handler for all.
     * Notes: Creates a channel if it doesnt exist
     */
    public SubscribeAll(channelIds: Channel[], subscriberId: string, callback: IPSHandler): this {
        for (const channelId of channelIds) {
            // setTimeout(() => {
                const channel: PSChannel = this.getChannel(channelId);
                channel.Subscribe(new PSSubscription(channelId, subscriberId, callback));
            // });
        }
        return this;
    }

    /**
     * Unsubscribe from a channel
     */
    public Unsubscribe(channelId: Channel, subscriberId: string): this {
        // setTimeout(() => {
            const channel: PSChannel = this.getChannel(channelId);
            channel.Unsubscribe(new PSSubscription(channelId, subscriberId));
        // }, 0);
        return this;
    }

    public UnsubscribeAll(subscriberId: string): this {
        for(let i = 0; i < this.channels.length; i++) {
            const channel = this.channels[i];
            channel.Unsubscribe(new PSSubscription(channel.Channel, subscriberId));
        }

        return this;
    }

    public ClearAll(): this {
        this.channels = [];
        return this;
    }


    /**
     * Broadcast a message to channel identified by [channelId]
     */
    public Publish(to: Channel, ...args: any[]): this {
        // setTimeout(() => {
            const channel: PSChannel = this.getChannel(to);
            if (!channel) {
                throw new Error(`PubSubError - Channel must exist. No channel found with id ${Channel[to]}`);
            }
            channel.Publish(...args);
        // }, 0);
        return this;
    }

    /**
     * Find or create a channel
     */
    private getChannel(channelId: Channel): PSChannel {
        let channel = this.channels.find((c) => c.Channel === channelId);

        if (!channel) {
            channel = new PSChannel(channelId);
            this.channels.push(channel);
        }

        return channel;
    }
}

/**
 * Class representing a PubSub Channel
 */
class PSChannel {

    public Channel: Channel;
    public Subscriptions: PSSubscription[];

    /**
     * Class constructor
     */
    constructor(channel: Channel) {
        this.Channel = channel;
        this.Subscriptions = [];
    }

    /**
     * Adds a subscriber to a channel
     */
    public Subscribe(subscription: PSSubscription) {
        this.Subscriptions.push(subscription);
    }

    /**
     * Remove a subscriber from a channel
     */
    public Unsubscribe(subscription: PSSubscription): boolean {
        const sub = this.Subscriptions.findIndex(s => s.Channel === subscription.Channel && s.SubscriberId === subscription.SubscriberId);
        if (sub !== -1) {
            this.Subscriptions.splice(sub, 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Publish a message to this channel
     */
    public Publish(...args: any[]) {
        for (const i in this.Subscriptions) {

            if (!this.Subscriptions.hasOwnProperty(i)) { continue; }

            const sub = this.Subscriptions[i];
            // setTimeout(sub.Callback, 0, ...args);
            sub.Callback(...args);

        }
    }
}

/**
 * Class representing a Subscription to a Pubsub Channel
 */
class PSSubscription {
    public SubscriberId: string;
    public Channel: Channel;
    public Callback?: IPSHandler;

    /**
     * Class constructor
     */
    constructor(channel: Channel, subscriberid: string, callback?: IPSHandler) {
        this.SubscriberId = subscriberid;
        this.Channel = channel;
        this.Callback = (callback) ? callback : null;
    }
}

enum Channel {
    KEYDOWN,
    KEYUP,
    DOC_LOADED
};

window.PS = new PublishSubscribe();


