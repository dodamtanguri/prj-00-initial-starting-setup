//Drag and Drop Interfaces
interface Draggable{
  dragStartHandler(event : DragEvent): void;
  dragEndHandler(event: DragEvent) : void;
}

interface DragTarget{
  dragOverHandler(event : DragEvent): void;
  dropHandler(event : DragEvent): void;
  dragLeaveHandler(event : DragEvent): void;
}
// Project Type
enum ProjectStatus {
    Active,
    Finished
  }
  
class Project {
    constructor(
      public id: string,
      public title: string,
      public description: string,
      public people: number,
      public status: ProjectStatus
    ) {}
  }

//Project State Management
//Listener 함수가 리턴하는 값에 신경쓰지 않음.
// Project State Management
type Listener<T> = (items: T[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}


class ProjectState extends State<Project> {
    //함수 참조 

    private projects :Project[] = [];

    private static instance: ProjectState;
    private constructor() {
        super();
    }

    static getInstance() {
        if(this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }


    addProject(title: string, description: string, numOfPeople: number) {
            const newProject = new Project(
              Math.random().toString(),
              title,
              description,
              numOfPeople,
              ProjectStatus.Active
            );
            this.projects.push(newProject);
            this.updateListeners();
          }

    moveProject(projectId: string, newStatus: ProjectStatus) {
     const project = this.projects.find(prj => prj.id === projectId);
     if(project && project.status != newStatus) {
      project.status = newStatus;

      this.updateListeners();

     }
    } 
    private updateListeners() {
      for (const listenerFn of this.listeners) {
        listenerFn(this.projects.slice());
      }
    }     
}
//ProjectState 인스턴스 생성 
const projectState = ProjectState.getInstance();

// Validation
interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  }
  
  function validate(validatableInput: Validatable) {
    let isValid = true;
    if (validatableInput.required) {
      isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (
      validatableInput.minLength != null &&
      typeof validatableInput.value === 'string'
    ) {
      isValid =
        isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (
      validatableInput.maxLength != null &&
                             validatableInput.value === 'string'
    ) {
      isValid =
        isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (
      validatableInput.min != null &&
      typeof validatableInput.value === 'number'
    ) {
      isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (
      validatableInput.max != null &&
      typeof validatableInput.value === 'number'
    ) {
      isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
  }


//autobind decorator
function autobind(_ : any, _2: string, descriptor: PropertyDescriptor){
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = 
    {
        configurable: true, 
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjDescriptor;
} 

// Component Base Class
// 렌더링할 수 있는 객체 
//<T extends HTMLElement, U extends HTMLElement> : 제네릭 클래스 만들기 >> 상속받을때마다 구체적인 타입을 지정할 수 있음. 
//abstract >> 직접 인스턴스화 하지 않고 항상 상속을 위해 사용하기 때문에 abstract class 로 선언. 
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
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

  class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable{
    private project: Project;

    get persons() {
      if (this.project.people === 1) {
        return '1 Person';
      } else {
        return `${this.project.people} persons`
      }
    }

    constructor(hostId: string, project:Project) {
      super('single-project', hostId, false, project.id);
      this.project = project;
      this.configure();
      this.renderContent();
    }
    @autobind
    dragStartHandler(event: DragEvent): void {
      event.dataTransfer!.setData('text/plain',this.project.id);
      event.dataTransfer!.effectAllowed = 'move';
      
    }
    dragEndHandler(_: DragEvent): void {
      console.log('DragEnd');
      
    }

    configure(): void {
      this.element.addEventListener('dragstart', this.dragStartHandler);
      this.element.addEventListener('dragend', this.dragEndHandler);
    }
    renderContent(): void {
      this.element.querySelector('h2')!.textContent = this.project.title;
      this.element.querySelector('h3')!.textContent = this.persons+ ' assigned';
      this.element.querySelector('p')!.textContent = this.project.description;
    }
  }


//ProjectList Class 
class ProjectList extends Component<HTMLDivElement, HTMLElement>implements DragTarget{

    assignedProjects: Project[];
  
    constructor(private type: 'active' | 'finished') {
        super('project-list','app',false, `${type}-projects`);
        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    
    }
  @autobind
  //렌더링된 섹션 위로 드래그하면 이 함수 실행 
  dragOverHandler(event: DragEvent): void {
    if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain'){
      //자바스크립트에서 드래그앤드롭은 dragOverHandler()에서 어떤 요소에 대해 preventDefault()를 호출해야만 허용이 되기때문! 
      event.preventDefault();
      const listEl = this.element.querySelector('ul')!;
      listEl.classList.add('droppable');
    }
  
  }
  @autobind
  dropHandler(event: DragEvent): void {
    const prjId = event.dataTransfer!.getData('text/plain');
    projectState.moveProject(prjId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);
    
  }
  @autobind
  dragLeaveHandler(_: DragEvent): void {

    const listEl = this.element.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }

    configure() {
      this.element.addEventListener('dragover', this.dragOverHandler);
      this.element.addEventListener('dragleave', this.dragLeaveHandler);
      this.element.addEventListener('drop', this.dropHandler);
        projectState.addListener((projects: Project[]) => {
            //프로젝트 filter
            const relevantProjects = projects.filter(prj => {
                if (this.type === 'active') {
                  return prj.status === ProjectStatus.Active;
                }
                return prj.status === ProjectStatus.Finished;
              });
            this.assignedProjects = relevantProjects;
            this.renderProjects();
          });
    }
    
  
    private renderProjects() {
        const listEl = document.getElementById(
          `${this.type}-projects-list`
        )! as HTMLUListElement;
        //모든 리스트 항목을 삭제하고 다시 렌더링 >> 새 프로젝트를 추가할 때마다 모든 프로젝트를 다시 렌더링 
        listEl.innerHTML = '';
        for (const prjItem of this.assignedProjects) {
          // const listItem = document.createElement('li');
          // listItem.textContent = prjItem.title;
          // listEl.appendChild(listItem);
          new ProjectItem(this.element.querySelector('ul')!.id, prjItem );
        }
      }
      //typescript에서 private abstract로 선언될 수 없기 때문에 private 선언자 지워줌 
     renderContent() {
      const listId = `${this.type}-projects-list`;
      this.element.querySelector('ul')!.id = listId;
      this.element.querySelector('h2')!.textContent =
        this.type.toUpperCase() + ' PROJECTS';
    }
  
  }
  


//ProjectInput Class
class ProjectInput extends Component<HTMLDivElement,HTMLFormElement >{

    titleInputElement : HTMLInputElement;
    descriptionInputElement : HTMLInputElement;
    peopleInputElement : HTMLInputElement;
    constructor() {
        super('project-input','app', true, 'user-input');
        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;
        this.configure();
    }

     configure() {
        //bind() >> 나중에 이 함수가 실행될 때 어떻게 실행될지 미리 설정하는 방법 
        //this >> 클래스를 참조 하고 bind() 때문에 submitHandler() 안의 클래스도 참조할 수 있음. 
        //decorator 사용해서 autobind 만들기 
        this.element.addEventListener('submit', this.submitHandler)
    }
    renderContent() {}


    private getherUserInput(): [string , string , number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;
        
        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true
          };
          const descriptionValidatable: Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
          };
          const peopleValidatable: Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
          };
      
          if (
            !validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)
          ) {
            alert('Invalid input, please try again!');
            return;
          } else {
            return [enteredTitle, enteredDescription, +enteredPeople];
          }
    }

    private clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        console.log(this.titleInputElement.value);
        const userInput = this.getherUserInput();

        if(Array.isArray(userInput))  {
            const [title, desc, people] = userInput;
            // console.log(title, desc, people);
            projectState.addProject(title, desc, people);
            this.clearInputs();
        }
        
    } 



}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');