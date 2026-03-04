import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { Collaborators } from './collaborators';
import { CollaboratorService, Collaborator } from '../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../services/collaborator-detail.service';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Collaborators Component', () => {
  let component: Collaborators;
  let fixture: ComponentFixture<Collaborators>;
  let mockCollaboratorService: any;
  let mockDetailService: any;
  let mockSnackBar: any;
  let mockRouter: any;
  let mockDialog: any;

  const mockCollaborators: Collaborator[] = [
    {
      id: 1,
      codigo: 100,
      nome: 'João Silva',
      pix: '11999999999',
      referencia: '123.456.789-00',
      dataCadastro: '2025-01-15T10:00:00',
      userCad: 'admin',
      dataAlteracao: '2025-01-15T10:00:00',
      userAlt: 'admin'
    },
    {
      id: 2,
      codigo: 101,
      nome: 'Maria Santos',
      pix: 'maria@email.com',
      referencia: '987.654.321-00',
      dataCadastro: '2025-02-20T14:30:00',
      userCad: 'admin',
      dataAlteracao: '2025-02-20T14:30:00',
      userAlt: 'admin'
    }
  ];

  const mockDetail: CollaboratorDetail = {
    id: 1,
    idColaborador: 1,
    valorDiaria: 150.00,
    idFuncao: 5,
    idSupervisor: 3,
    idPosto: 2
  };

  beforeEach(async () => {
    mockCollaboratorService = {
      getAll: vi.fn().mockReturnValue(of(mockCollaborators)),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };

    mockDetailService = {
      getByCollaboratorId: vi.fn().mockReturnValue(of([mockDetail]))
    };

    mockSnackBar = {
      open: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(true),
        componentInstance: {},
        updatePosition: vi.fn(),
        updateSize: vi.fn(),
        close: vi.fn()
      })
    };

    await TestBed.configureTestingModule({
      imports: [Collaborators],
      providers: [
        provideAnimationsAsync(),
        { provide: CollaboratorService, useValue: mockCollaboratorService },
        { provide: CollaboratorDetailService, useValue: mockDetailService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Collaborators);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load collaborators on init', () => {
      component.ngOnInit();
      expect(mockCollaboratorService.getAll).toHaveBeenCalled();
      expect(component.dataSource.data).toEqual(mockCollaborators);
    });

    it('should display correct number of collaborators', () => {
      component.dataSource.data = mockCollaborators;
      expect(component.dataSource.data.length).toBe(2);
    });
  });

  describe('Load Collaborators', () => {
    it('should populate dataSource with collaborators from API', () => {
      component.loadCollaborators();
      expect(component.dataSource.data).toEqual(mockCollaborators);
    });

    it('should handle error by logging to console', () => {
      mockCollaboratorService.getAll.mockReturnValue(
        throwError(() => new Error('API Error'))
      );
      const consoleSpy = vi.spyOn(console, 'error');

      component.loadCollaborators();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Row Toggle (Expand/Collapse)', () => {
    beforeEach(() => {
      component.dataSource.data = mockCollaborators;
    });

    it('should expand row and fetch details when clicking on a closed row', () => {
      const element = mockCollaborators[0];
      
      component.toggleRow(element);

      expect(component.expandedElement).toBe(element);
      expect(mockDetailService.getByCollaboratorId).toHaveBeenCalledWith(element.id);
    });

    it('should collapse row when clicking on an already expanded row', () => {
      const element = mockCollaborators[0];
      component.expandedElement = element;

      component.toggleRow(element);

      expect(component.expandedElement).toBeNull();
      expect(component.elementDetail).toBeNull();
    });

    it('should fetch different detail when toggling to a new row', () => {
      const element1 = mockCollaborators[0];
      const element2 = mockCollaborators[1];

      component.toggleRow(element1);
      expect(component.expandedElement).toBe(element1);

      component.toggleRow(element2);
      expect(component.expandedElement).toBe(element2);
      expect(mockDetailService.getByCollaboratorId).toHaveBeenCalledWith(element2.id);
    });
  });

  describe('Fetch Details', () => {
    it('should load collaborator details from API', async () => {
      const element = mockCollaborators[0];
      
      component.fetchDetails(element);

      expect(mockDetailService.getByCollaboratorId).toHaveBeenCalledWith(element.id);
      expect(component.elementDetail).toEqual(mockDetail);
      expect(component.loadingDetail).toBe(false);
    });

    it('should not fetch if element has no id', () => {
      const element = { ...mockCollaborators[0], id: undefined };
      
      component.fetchDetails(element);

      expect(mockDetailService.getByCollaboratorId).not.toHaveBeenCalled();
    });

    it('should display PIX from collaborator in detail row', () => {
      const element = mockCollaborators[0];
      component.expandedElement = element;
      component.elementDetail = mockDetail;

      // Component should show expandedElement.pix (from Collaborator)
      expect(component.expandedElement?.pix).toBe('11999999999');
    });

    it('should display daily value from detail row', () => {
      const element = mockCollaborators[0];
      component.elementDetail = mockDetail;

      expect(component.elementDetail?.valorDiaria).toBe(150.00);
    });
  });

  describe('Edit Collaborator', () => {
    it('should navigate to edit page with collaborator id', () => {
      const element = mockCollaborators[0];
      
      component.editCollaborator(element);

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/colaboradores',
        element.id,
        'editar'
      ]);
    });

    it('should not navigate if collaborator has no id', () => {
      const element = { ...mockCollaborators[0], id: undefined };
      
      component.editCollaborator(element);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Add Collaborator', () => {
    it('should navigate to add collaborator page', () => {
      component.addCollaborator();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/colaboradores/novo']);
    });
  });

  describe('Filter/Search', () => {
    beforeEach(() => {
      component.dataSource.data = mockCollaborators;
    });

    it('should filter collaborators by name', () => {
      const filterValue = 'João';
      const event = { target: { value: filterValue } } as any;

      component.applyFilter(event);

      // The dataSource should have filtering applied
      expect(component.dataSource.filter).toBe(filterValue.trim().toLowerCase());
    });

    it('should filter collaborators by code', () => {
      const filterValue = '100';
      const event = { target: { value: filterValue } } as any;

      component.applyFilter(event);

      expect(component.dataSource.filter).toBe(filterValue.trim().toLowerCase());
    });

    it('should handle empty filter', () => {
      const event = { target: { value: '' } } as any;

      component.applyFilter(event);

      expect(component.dataSource.filter).toBe('');
    });
  });

  describe('Displayed Columns', () => {
    it('should have correct columns in table', () => {
      const expectedColumns = [
        'codigo',
        'nome',
        'dataCadastro',
        'userCad',
        'dataAlteracao',
        'userAlt',
        'actions'
      ];

      expect(component.displayedColumns).toEqual(expectedColumns);
    });
  });

  describe('Data Binding', () => {
    it('should bind collaborator data correctly in table', () => {
      component.dataSource.data = mockCollaborators;

      const data = component.dataSource.data;
      expect(data[0].nome).toBe('João Silva');
      expect(data[0].pix).toBe('11999999999');
      expect(data[1].pix).toBe('maria@email.com');
    });

    it('should display address information from collaborator', () => {
      const collaborator = mockCollaborators[0];
      component.expandedElement = collaborator;

      expect(component.expandedElement?.referencia).toBe('123.456.789-00');
    });
  });
});
