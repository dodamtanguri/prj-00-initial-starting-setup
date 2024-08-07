import {Project, ProjectStatus} from '../models/project.js';

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


export class ProjectState extends State<Project> {
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
export const projectState = ProjectState.getInstance();

