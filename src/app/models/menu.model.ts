export interface MenuItem {
  codigo: number;
  descricao: string;
  icone?: string;
  url?: string;
  ordem?: number;
  ativo: boolean;
  dataCriacao?: string;
}

export interface MenuComSubMenus {
  codigo: number;
  descricao?: string;
  icone?: string;
  url?: string;
  ordem?: number;
  subMenus?: SubMenu[];
}

export interface SubMenu {
  codigo: number;
  codigoMenu: number;
  descricao: string;
  icone?: string;
  url?: string;
  ordem?: number;
  ativo: boolean;
  perfilAcesso?: string;
  dataCriacao?: string;
}

export type MenuList = MenuComSubMenus[];
