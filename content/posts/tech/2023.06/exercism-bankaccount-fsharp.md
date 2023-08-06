+++
title = "Bank Account task on Exercism in F#"
date = 2023-06-10T16:36:33+02:00
tags = ["f#", "dotnet"]
categories = []
+++

Functional programming was always an interesting topic for me. I've firstly seen it in reality at the university, where we had a very basic and confusing course for a single semester. As part of this course, we've tried to study the general concepts and `Clojure` as a programming language. I could not say that it gave me a lot, but at least I've tried to grasp something outside of classic OOP.

There were few attempts on my own afterwards - some `F#`, then `OCaml`, `Haskell`, next quite a long journey with `Erlang`, `Elixir` and the fantastic `BEAM VM`, and now I've returned to `F#` as a strongly typed language working on a VM that I'm pretty familiar with - `dotnet`. As the best way of learning something is to use in practice, I've referred to [Exercism](https://exercism.org) to get a set of simple yet educational tasks to get familiar with the concepts and the language.

I've solved a bunch of exercises and at some point reached [Bank Account](https://exercism.org/tracks/fsharp/exercises/bank-account) task. Even though the exercise itself is pretty straightforward, there is one important piece inside:

> Create an account that can be accessed from multiple threads/processes (terminology depends on your programming language).

"Ok, this is where concurrency and multithreading comes into play" was my initial thought. `dotnet` as platform has a plenty of thread synchronisation primitives available, such as [Monitor](https://learn.microsoft.com/en-us/dotnet/api/system.threading.monitor?view=net-7.0) and the helper [lock statement](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/lock), [Interlocked](https://learn.microsoft.com/en-us/dotnet/api/system.threading.interlocked?view=net-7.0), [Mutex](https://learn.microsoft.com/en-us/dotnet/api/system.threading.mutex?view=net-7.0), [Semaphore](https://learn.microsoft.com/en-us/dotnet/api/system.threading.semaphore?view=net-7.0) and many others. I'm a big fan of `BEAM VM` and [Actor Model](https://en.wikipedia.org/wiki/Actor_model). Even though `BEAM` [does not implement the actor model](https://codesync.global/media/almost-actors-comparing-pony-language-to-beam-languages-erlang-elixir/), it relies on a message-based approach to concurrency (as actors). I remembered that there was some form of actor model in `F#` library as well. I've started the search and found [an awesome article](https://fsharpforfunandprofit.com/posts/concurrency-actor-model/) written by Scott Wlaschin. The article contains a lot of useful information about the concepts and concrete implementation in `F#`.

`F#` library has a class called [MailboxProcessor](https://fsharp.github.io/fsharp-core-docs/reference/fsharp-control-fsharpmailboxprocessor-1.html) that represents some form of an actor or `agent`. In essence this is an [in-memory message queue](https://en.wikibooks.org/wiki/F_Sharp_Programming/MailboxProcessor) that could receive messages from multiple threads, however the actual processing happens on a single thread. I.e., it is heavily inspired by `Erlang` even though much, much simpler.

I went through a series of articles - [here](https://en.wikibooks.org/wiki/F_Sharp_Programming/MailboxProcessor), [here](https://www.developerfusion.com/article/139804/an-introduction-to-f-agents/) and [here](https://learn.microsoft.com/en-us/previous-versions/visualstudio/visual-studio-2010/hh297112(v=vs.100)) to become more familiar with the concept. `MailboxProcessor` has all the required methods for the task - `Post` to send a message asynchronously and  `PostAndReply` - to send a message and receive a response.

The missing point for me was how this `agent` should be modelled from the code perspective in order to encapsulate its message-based behaviour, i.e. model a `BankAccount` entity. In `Elixir` a set of functions was defined (functional interface) around the [GenServer](https://elixir-lang.org/getting-started/mix-otp/genserver.html) to simplify working with it. [Class](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/classes) in `F#` is an answer that helps to achieve this functional interface and hide the collaboration with the `agent`. Each operation with an entity (`BankAccount`) should rely on a certain type of message, and discriminated unions and pattern-matching in `F#` are the answer to this. As a side not, `Elixir` relies on a similar mechanism, even though it is a dynamic language.

At the end of the day, the piece of code looked like this (`WARNING SPOILER`):

```fsharp
module BankAccount

type Agent<'T> = MailboxProcessor<'T>

type BankAccountOperation =
    | Open
    | Close
    | GetBalance of AsyncReplyChannel<decimal option>
    | UpdateBalance of decimal

type BankAccountStatus =
    | Active
    | Inactive

type BankAccountState =
    { Status: BankAccountStatus
    Balance: decimal option }

type BankAccount() =

    let mutable state = { Status = Inactive; Balance = None }

    let openAccount () =
        state <- { Status = Active; Balance = Some 0.0m }

    let closeAccount () =
        state <- { Status = Inactive; Balance = None }

    let getBalance () = state.Balance

    let updateBalance amount =
        match state.Status with
        | Active ->
            let balance = getBalance () |> Option.get
            let newBalance = balance + amount
            state <- { state with Balance = Some newBalance }
        | _ -> ()

    let agent =
        Agent.Start(fun inbox ->
            let rec messageLoop () =
                async {
                    let! msg = inbox.Receive()

                    match msg with
                    | Open -> openAccount ()
                    | Close -> closeAccount ()
                    | GetBalance replyChannel ->
                      let balance = getBalance ()
                      replyChannel.Reply balance
                    | UpdateBalance amount ->
                        updateBalance amount

                    return! messageLoop ()
                }
            messageLoop ())

    member _.Open() = agent.Post Open

    member _.Close() = agent.Post Close

    member _.GetBalance() =
        agent.PostAndReply(
            (fun replyChannel -> GetBalance replyChannel), 10000)

    member _.UpdateBalance amount =
        agent.Post(UpdateBalance amount)

let mkBankAccount () = BankAccount()

let openAccount (account: BankAccount) =
    account.Open()
    account

let closeAccount (account: BankAccount) =
    account.Close()
    account

let getBalance (account: BankAccount) = account.GetBalance()

let updateBalance (change: decimal) (account: BankAccount) =
    account.UpdateBalance change
    account
```
