export type Message = {
  role: "user" | "ai";
  content: string;
};

export type World = {
  description: string;
  era: string;
  technology: string;
  rules: string;
};

export type Character = {
  id: string;
  name: string;
  age: string;
  personality: string;
  background: string;
  goal: string;
};

export type Plot = {
  summary: string;
  chapters: string;
};

export type Timeline = {
  past: string;
  present: string;
  future: string;
};

export type Scenario = {
  title: string;
  content: string;
};

export type Project = {
  world: World;
  characters: Character[];
  plot: Plot;
  timeline: Timeline;
  scenario: Scenario;
};

export type Session = {
  id: string;
  title: string;
  messages: Message[];
  project: Project;
};