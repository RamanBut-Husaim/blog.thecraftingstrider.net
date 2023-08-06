+++
title = "Заданне Bank Account (Exercism) на F#"
date = 2023-06-10T16:36:33+02:00
tags = ["f#", "dotnet"]
categories = []
+++

Я заўсёды цікавіўся функцыянальным праграмаваннем. Першы раз я пазнаёміўся з ім ва ўніверсітэце, калі ў адным з апошніх семестраў нам чыталі базавы, але ж разам з тым даволі заблытаны курс. Тэарэтычная частка не мела амаль ніякага дачынення да тэмы і прайшла амаль цалкам міма, а вось на практыцы малады і таленавіты выкладчык пазнаёміў нас з мовай `Clojure`. Не магу сказаць, што пад канец семестру я добра валодаў прадметнай базай, але ж нейкае пачатковае разуменне меў. А галоўнае, была цікавасць больш пазнаёміцца з падыходам.

Пасля гэтага было некалькі спроб увайсці ў функцыянальнае праграмаванне - спачатку асновы `F#`, потым `OCaml`, `Haskell` на зусім базавым узроўні, і далей ужо на працягу года ў вольны час я знаёміўся з `Erlang`, `Elixir` і фантастычнай віртуальнай машынай `BEAM`. Зараз я зноў звярнуўся да `F#` праз яго неверагодную і даволі моцную статычную сістэму тыпаў і больш-менш знаёмую мне платформу `dotnet`, на якой ён працуе. Найлепшы шлях вывучаць новае ў праграмаванні - пачынаць карыстацца і спрабаваць пісаць маленькія праграмы. І вось для гэтага вельмі добра падыходзіць платформа з назвай [Exercism](https://exercism.org), якая дазваляе вывучаць мову праграмаванне з дапамогай простых (і часамі не вельмі) заданняў.

У рамках курса па `F#` я сутыкнуўся з адным з такіх заданняў - [Bank Account](https://exercism.org/tracks/fsharp/exercises/bank-account). Нягледзячы на тое, што заданне само па сабе зусім не складанае, але ж у ім ёсць вельмі цікавая ўмова:

> Create an account that can be accessed from multiple threads/processes (terminology depends on your programming language).

> Доступ да рахунку павінен ажыцяўляцца з некалькіх патокаў/працэсаў (тэрміналогія залежыць ад вашай мовы праграмавання).

"Файна, вось тут трэба глядзець у бок сінхранізацыі патокаў і паралельнага праграмавання" падумаў я. Платформа `dotnet` уключае шмат канструкцый для сінхранізацыі патокаў. У якасці прыклада можна прывесці [манітор](https://learn.microsoft.com/en-us/dotnet/api/system.threading.monitor?view=net-7.0) і яго сінтаксічны дапаможнік у выглядзе [lock аператара](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/lock), клас [Interlocked](https://learn.microsoft.com/en-us/dotnet/api/system.threading.interlocked?view=net-7.0), [м'ютэкс](https://learn.microsoft.com/en-us/dotnet/api/system.threading.mutex?view=net-7.0), [семафор](https://learn.microsoft.com/en-us/dotnet/api/system.threading.semaphore?view=net-7.0) і шмат іншых. Сам я з'яўляюся адданым прыхільнікам `BEAM` і [мадэлі актараў](https://en.wikipedia.org/wiki/Actor_model). Нягледзячы на тое, што віртуальная машына `BEAM` [дакладна не прытрымлівае мадэлі актараў](https://codesync.global/media/almost-actors-comparing-pony-language-to-beam-languages-erlang-elixir/), яна ўсё роўна абапіраецца на падыход абмену паведамленнямі (message-passing) для ажыццяўлення паралельнага праграмавання (як і актары). Амаль адразу я ўспомніў, што ў стандартнай бібліятэцы для `F#` была нешта звязанае з актарамі, вось толькі ведаў пра гэта ў мяне не засталося (а можа і не было :). Пошук у сеці інтэрнэт хутка выдаў мне [фундаментальны артыкул](https://fsharpforfunandprofit.com/posts/concurrency-actor-model/) ад знакамітага гуру `F#` Scott Wlaschin. Акрамя тэорыі ў гэтым артыкуле можна знайсці яшчэ і практычную даведку пра актары ў `F#`.

Найбольш каштоўнай інфармацыя з артыкула для мяне было тое, што я дазнаўся пра існаванне класа [MailboxProcssor](https://fsharp.github.io/fsharp-core-docs/reference/fsharp-control-fsharpmailboxprocessor-1.html), які з'яўляецца нейкай формай актара альбо `агента` у `F#`. Фактычна, `MailboxProcessor` гэта [чарга паведамленняў у памяці](https://en.wikibooks.org/wiki/F_Sharp_Programming/MailboxProcessor), якая можа атрымліваць паведамленні з розных патокаў, але апрацоўваць іх будзе ў адным патоку. Відавочна, што аўтары натхняліся `Erlang`, але зрабілі нашмат больш простую реэлізацыю.

Каб глыбей пазнаёміцца з тэмай, я прайшоўся па серыі артыкулаў [тут](https://en.wikibooks.org/wiki/F_Sharp_Programming/MailboxProcessor), [тут](https://www.developerfusion.com/article/139804/an-introduction-to-f-agents/) і [тут](https://learn.microsoft.com/en-us/previous-versions/visualstudio/visual-studio-2010/hh297112(v=vs.100)). Аказалася, што `MailboxProcessor` мае ўсе неабходныя для вырашэння задачы метады: `Post` для асінхроннай адпраўкі паведамленняў, `PostAndReply` - для адпраўкі паведамленняў з чаканнем адказу.

Тым не менш, галоўным пытаннем для мяне заставалася яшчэ зразумець, якім чынам гэты `BankAccount` клас павінен выглядаць у кодзе на `F#`, каб ён інкапсуліраваў сваю залежнасць ад чаргі паведамленняў. У `Elixir`, напрыклад, стваралі набор функцый (функцыянальны інтэрфейс) вакол [GenServer](https://elixir-lang.org/getting-started/mix-otp/genserver.html), што значна спрашчала карыстальнікам працу па інтэграцыі з такімі канструкцыямі. [Класы](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/classes) у `F#` як раз і дапамагаюць стварыць функцыянальны інтэрфейс і схаваць узаемадзеянне з `агентамі`. Кожная аперацыя з `BankAccount` павінна абапірацца на свой тып паведамлення, а pattern matching і discriminated union у `F#` вельмі зручна дапамагаюць апрацоўваць гэтыя паведамленні ў кодзе. Трэба адзначыць, што `Elixir` карыстаецца такімі ж падыходамі нягледзячы на тое, што гэта дынамічная мова праграмавання.

Напрыканцы, клас `BankAccount` выглядаў неяк так (`АСЦЯРОЖНА, СПОЙЛЕР`):

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
