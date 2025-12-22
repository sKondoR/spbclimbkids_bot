export interface IRoute {
  name: string;
  grade: string;
  isBoulder: boolean;
  isTopRope: boolean;
  region: string;
  date: string;
}

export type IRoutes = Array<IRoute>;

export interface IClimber {
  id: number;
  allClimbId: number;
  name: string | null;
  leads: IRoute[] | null;
  boulders: IRoute[] | null;
  updatedAt: string | null;
  routesCount: number | null;
  scores: number | null;
}