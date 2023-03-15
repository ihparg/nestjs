/**
 * 根据Schema定义自动生成，不要手动修改
 */

/** 评论 */
export interface Comment {
  _id: string;

  content: string;

  user?: string;
}

export interface Hello {
  children?: Hello[];

  createAt: Date;

  lastUpdateTime?: Date;
}

/** 用户信息 */
export interface User {
  /** 年龄 */

  age?: number;

  array: string[];

  decimal?: number;

  friends?: User[];

  friends2?: {
    firstname?: string;

    lastname?: string;
  }[];

  id: string;

  /** anything */

  json?: any;

  map?: {
    [key: string]: string;
  };

  /** 姓名 */

  name?: Name;

  object?: Name;

  /** 亲戚 */

  relation?: {
    [key: string]: User;
  };

  shop?: Shop;

  shops?: Shop[];
}

export interface Name {
  firstName?: string;

  lastName?: string;
}

/** 文章 */
export interface Article {
  _id: string;

  arrayWithObject?: {
    _id?: string;

    comment?: Comment;

    name?: string;
  }[];

  /** 评论列表 */

  comments?: Comment[];

  /** 评论 */

  component?: Comment;

  createdAt: Date;

  json?: any;

  /** 用户名 */

  name: string;

  object?: {
    bar?: number[];

    foo?: string;
  };
}

export interface Layout {
  createAt: Date;

  lastUpdateTime?: Date;

  layout?: Layout;
}

/** 测试结构 */
export interface Test {
  array?: User[];

  blob?: Blob;

  boolean?: boolean;

  datetime?: Date;

  id?: string;

  json?: any;

  map?: {
    [key: string]: number;
  };

  object: {
    hello?: string;

    /** 用户名列表 */

    names: string[][];
  };
}

export interface Book {
  createTime: Date;

  id?: string;

  long?: string;

  /** mvp */

  name: string;

  type?: BugType;
}

export interface PingPong {
  createAt: Date;

  foobarList?: FooBar[];

  lastUpdateTime?: Date;
}

/** 返回结果 */
export interface Response {
  /** 返回码 */

  code: 200 | 400 | 403 | 500;

  message?: string;
}

/** 店铺 */
export interface Shop {
  /** 地址 */

  address?: string;

  id: string;

  layout?: {
    id?: number;

    layout?: Layout;
  };

  user?: User;

  users: User[];
}

/** 测试 */
export interface FooBar {
  createAt: Date;

  lastUpdateTime?: Date;

  pingPong?: PingPong;
}

export interface Story {
  id?: string;
}

/** bug类型 */
export type BugType = "0" | "1" | "2";
