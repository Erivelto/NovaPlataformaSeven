export interface MenuItem {
  codigo: number;
  descricao: string;
  icone?: string;
  url?: string;
  ordem?: number;
  ativo: boolean;
  dataCriacao?: string;
  submenus?: MenuItem[];
}

export type MenuList = MenuItem[];
