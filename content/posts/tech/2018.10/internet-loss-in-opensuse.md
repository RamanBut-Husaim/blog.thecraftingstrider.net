+++
title = "Internet issue in OpenSUSE"
date = 2018-10-12T21:58:12+03:00
tags = ["linux"]
categories = []
+++

Though I have a MacBook PRO 13' that I'm using mostly to read articles and perform small dev tasks my main workstation is Intel Core I7-based desktop with two OSes installed - Windows 10 (for entertainment) and OpenSUSE as a core dev machine. I find OpenSUSE an amazing and quite stable distribution however from time to time I'm facing issues with it as well.

And today became one of these interesting days. **No internet**. Quite straightforward and simple. The first bad sign was the error banner that `curl` could not verify the repository status and failed with some connection issue. The second one - no tabs could be load in Firefox. The third one - `ping` returns no results at all for `google.ru`. Ok. The checklist was the following:

- [x] The router is turned one.
- [x] The internet is available on MacBook and mobile phone.
- [x] Mac and phone are using Wi-Fi and PC connects with ethernet cable so I've verified whether it stays firmly in the socket on both end - router and PC.
- [x] Reboot. The hope is lot. Or...
- [x] Reboot in Windows. Everything is fine then the source of evil is inside my openSUSE distribution.
- [x] Start googling.

One of the top links in the search results was a similar issue from openSUSE forums [No internet on wired connection](https://forums.opensuse.org/showthread.php/532852-No-internet-on-wired-connection). This seems to be what I was looking for. The first clue - check whether the issue could be connected with DNS. I've tried to perform ping with one of the IPs listed in the thread `ping 130.57.66.6` and it was successful! Ok. What's next?

{{< figure src="/posts/tech/2018.10/internet-loss-in-opensuse_01.png" alt="Ping results" >}}

One of the forum members advices to remove `etc/resolve.conf`. This approach did not help the author of the issue but I've decided to read about this file and give it a try. Seems that [resolv.conf](https://en.wikipedia.org/wiki/Resolv.conf) is the file used for DNS resolver configuration in OS. If this file does not exist and DHCP is enabled OS recreates it after the restart. Ok. Let's try then.

```sh
sudo rm /etc/resolve.conf
```

That's it. After the restart the system has started to work like a charm.