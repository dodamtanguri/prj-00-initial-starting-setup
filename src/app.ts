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
type Listener = (items: Project[]) => void;


class ProjectState {
    //함수 참조 
    private listeners: Listener[] = [];
    private projects :Project[] = [];

    private static instance: ProjectState;
    private  constructor() {

    }

    static getInstance() {
        if(this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addListener(listenerFn: Listener) {
        this.listeners.push(listenerFn);
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

//ProjectList Class 
class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    assignedProjects: Project[];
  
    constructor(private type: 'active' | 'finished') {
      this.templateElement = document.getElementById(
        'project-list'
      )! as HTMLTemplateElement;
      this.hostElement = document.getElementById('app')! as HTMLDivElement;
      this.assignedProjects = [];
  
      const importedNode = document.importNode(
        this.templateElement.content,
        true
      );
      this.element = importedNode.firstElementChild as HTMLElement;
      this.element.id = `${this.type}-projects`;
  
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
  
      this.attach();
      this.renderContent();
    }
  
    private renderProjects() {
        const listEl = document.getElementById(
          `${this.type}-projects-list`
        )! as HTMLUListElement;
        //모든 리스트 항목을 삭제하고 다시 렌더링 >> 새 프로젝트를 추가할 때마다 모든 프로젝트를 다시 렌더링 
        listEl.innerHTML = '';
        for (const prjItem of this.assignedProjects) {
          const listItem = document.createElement('li');
          listItem.textContent = prjItem.title;
          listEl.appendChild(listItem);
        }
      }
  
    private renderContent() {
      const listId = `${this.type}-projects-list`;
      this.element.querySelector('ul')!.id = listId;
      this.element.querySelector('h2')!.textContent =
        this.type.toUpperCase() + ' PROJECTS';
    }
  
    private attach() {
      this.hostElement.insertAdjacentElement('beforeend', this.element);
    }
  }
  


//ProjectInput Class
class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement : HTMLInputElement;
    descriptionInputElement : HTMLInputElement;
    peopleInputElement : HTMLInputElement;
    constructor() {
        this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as HTMLFormElement;
        this.element.id = 'user-input'

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;
        this.configure();
        this.attach();
       
    }

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
    private configure() {
        //bind() >> 나중에 이 함수가 실행될 때 어떻게 실행될지 미리 설정하는 방법 
        //this >> 클래스를 참조 하고 bind() 때문에 submitHandler() 안의 클래스도 참조할 수 있음. 
        //decorator 사용해서 autobind 만들기 
        this.element.addEventListener('submit', this.submitHandler)
    }

    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element);
    }
}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');