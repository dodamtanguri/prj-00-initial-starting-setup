
    // Component Base Class
// 렌더링할 수 있는 객체 
//<T extends HTMLElement, U extends HTMLElement> : 제네릭 클래스 만들기 >> 상속받을때마다 구체적인 타입을 지정할 수 있음. 
//abstract >> 직접 인스턴스화 하지 않고 항상 상속을 위해 사용하기 때문에 abstract class 로 선언. 
export abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    //제네릭 클래스이용해서 상속을 받을 때 구체적인 타입을 설정할 수 있음 
    hostElement: T;
    element: U;
  
    constructor(
      templateId: string,
      hostElementId: string,
      insertAtStart: boolean,
      newElementId?: string
    ) {
      this.templateElement = document.getElementById(
        templateId
      )! as HTMLTemplateElement;
      this.hostElement = document.getElementById(hostElementId)! as T;
  
      const importedNode = document.importNode(
        this.templateElement.content,
        true
      );
      this.element = importedNode.firstElementChild as U;
      if (newElementId) {
        this.element.id = newElementId;
      }
  
      this.attach(insertAtStart);
    }
  
    private attach(insertAtBeginning: boolean) {
      this.hostElement.insertAdjacentElement(
        insertAtBeginning ? 'afterbegin' : 'beforeend',
        this.element
      );
    }
    //Component로 부터 상속받은 모든 클래스가 이 두 메소드를 추가하고 제공하도록 강제
    abstract configure(): void;
    abstract renderContent(): void;
  }
  
