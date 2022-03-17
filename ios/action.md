### action 
https://www.raywenderlich.com/books/rxswift-reactive-programming-with-swift/v4.0/chapters/20-action


Action是响应式应用程序的重要组成部分。考虑一下代码中的操作，定义大致如下：

- 触发事件表明是时候做某事了。
- 执行一项任务。
- 立即，稍后（或者可能永远不会！），执行任务放回一些数据


注意到一个模式了吗？触发事件可以表示为某事物的可观察序列，例如按钮点击、计时器滴答声或手势，它们可能会或可能不会传达数据，但始终表示要完成的工作。因此，每个动作的结果都可以看作是一系列结果，每完成一项工作就有一个结果。

中间是Action物体。它执行以下操作：

提供一个inputs观察者来绑定可观察序列。您也可以手动触发新工作。
可以观察一个Observable<Bool>以确定它的“启用”状态（除了它当前是否正在执行之外）。
调用执行/启动工作并返回可观察结果的工厂闭包。
公开elements所有工作结果的可观察序列（flatMap所有工作可观察的一个）。
优雅地处理工作 observables 发出的错误。
Action暴露 observables 的错误，当前的执行状态，每个工作 observable 的 observable，保证前一个工作没有完成时没有新的工作开始，而且它通常是一个很酷的类，你不想错过它！

最后但并非最不重要的一点是，Action 定义了一个contract，您在其中提供一些（或不提供）数据，然后完成一些工作，您稍后可能会获得结果数据。该合约的实现方式与使用该操作的代码无关。您可以用模拟操作替换真实操作以进行测试，而不会影响代码，只要模拟尊重合同。

创建一个动作
Action是一个泛型类，定义为class Action<Input, Element>. Input是提供给工厂工人函数的输入数据的类型。Element是您的工厂函数返回的可观察对象发出的元素类型。

最简单的动作示例不需要输入，执行一些工作并在不产生数据的情况下完成：

let buttonAction: Action<Void, Void> = Action {
  print("Doing some work")
  return Observable.empty()
}

这很简单。获取凭据、执行网络请求并返回“登录”状态的操作又如何呢？

let loginAction: Action<(String, String), Bool> = Action { credentials in
  let (login, password) = credentials
  // loginRequest returns an Observable<Bool>
  return networkLayer.loginRequest(login, password)
}

注意Action：当您的工厂关闭返回的可观察对象完成或出错时，每次执行都被视为完成。这可以防止启动多个长时间运行的操作。这种行为对网络请求很方便，如下所示。

Action看起来很酷，但它在各种情况下的用处可能不是很明显，所以让我们看几个实际的例子。

连接按钮
Action带有针对UIButton和其他几个 UIKit 组件的响应式扩展。它还定义了CocoaAction, a typealiasfor Action<Void, Void>— 非常适合不期望输出的按钮。

要连接按钮，只需执行以下操作：

button.rx.action = buttonAction

每次用户按下按钮时，动作都会执行。如果上一次按下的动作未完成，则取消点击。通过将其设置为从按钮中删除操作nil：

button.rx.action = nil

作曲行为
让我们loginAction再次考虑上面的创建操作示例。像这样将它连接到您的 UI：

let loginPasswordObservable = Observable.combineLatest(loginField.rx.text, passwordField.rx.text) {
  ($0, $1)
}
loginButton.rx.tap
  .withLatestFrom(loginPasswordObservable)
  .bind(to: loginAction.inputs)
  .disposed(by: disposeBag)

每次您的用户按下登录按钮时，登录和密码文本字段的最新值都会发送inputs给loginAction. 如果该操作尚未执行（例如，如果先前的登录尝试没有进行），它会调用您的工厂关闭。一个新的登录请求发出，结果 observable 将提供 atrue或false值，否则将出错。

现在您可以订阅操作的elementsobservable 并在登录成功时收到通知：

loginAction.elements
  .filter { $0 } // only keep "true" values
  .take(1)       // just interested in first successful login
  .subscribe(onNext: {
    // login complete, push the next view controller
  })
  .disposed(by: disposeBag)

错误会得到特殊处理，以避免破坏您的订阅者序列。有两种错误：

notEnabled- 该操作已在执行或禁用，并且
underlyingError(error)- 底层序列发出的错误。
你可以这样处理它们：

loginAction
  .errors
  .subscribe(onError: { error in
    guard case .underlyingError(let err) = error else {
      return
    }

    // update the UI to warn about the error
    }
  })
  .disposed(by: disposeBag)

将工作项传递给单元格
Action 有助于解决一个常见问题：如何连接UITableView单元格中的按钮。Action救援！配置单元格时，您将操作分配给按钮。这样，您无需将实际工作放在单元子类中，有助于强制执行干净的分离——如果您使用的是 MVVM 架构，更是如此。

重用“表格和集合视图”手册章节中的示例，以下是绑定按钮的简单方法：

observable.bind(to: tableView.rx.items) {
  (tableView: UITableView, index: Int, element: MyModel) in
  let cell = tableView.dequeueReusableCell(withIdentifier: "buttonCell", for: indexPath)
  cell.button.rx.action = CocoaAction { [weak self] in
  	// do something specific to this cell here
  	return .empty()
  }
  return cell
}
.disposed(by: disposeBag)

当然，您可以设置现有操作而不是创建新操作。可能性是无止境！

手动执行
要手动执行一个动作，调用它的方法，传递给它一个动作类型execute(_:)的元素：Input

loginAction
  .execute(("john", "12345"))
  .subscribe(onNext: {
    // handle return of action execution here
  })
  .disposed(by: disposeBag)

非常适合 MVVM
如果你正在使用 MVVM（参见第 24 章，“使用 RxSwift 的 MVVM”和第 25 章，“构建一个完整的 RxSwift 应用程序”），你现在可能已经发现 RxSwift 非常适合这种架构模式。动作也是绝配！它很好地补充了视图控制器和视图模型之间的分离。将您的数据公开为可观察的和所有可操作的功能，Action以实现 MVVM 的幸福！


