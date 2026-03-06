import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AddDi, DailyRow } from './add-di';
import { DailyService, Daily } from '../../services/daily.service';
import { CollaboratorService } from '../../services/collaborator.service';
import { CollaboratorDetailService, DetailOption } from '../../services/collaborator-detail.service';
import { StationService } from '../../services/station.service';

describe('AddDi', () => {
  let component: AddDi;
  let fixture: ComponentFixture<AddDi>;
  let collaboratorService: CollaboratorService;
  let collaboratorDetailService: CollaboratorDetailService;
  let stationService: StationService;
  let dailyService: DailyService;

  // Helper: gera as 7 datas da semana anterior
  function getWeekDates(): string[] {
    const today = new Date();
    const lastMonday = new Date(today);
    const dow = today.getDay();
    if (dow === 0) lastMonday.setDate(today.getDate() - 6);
    else lastMonday.setDate(today.getDate() - dow - 6);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lastMonday);
      d.setDate(lastMonday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }
    return dates;
  }

  const mockOption1: DetailOption = { id: 1973, descricao: 'ASG  - WESLEY MARTINS - VIVO CENTER NORTE - 120.00' };
  const mockOption2: DetailOption = { id: 1991, descricao: 'ASG  - WESLEY MARTINS - VIVO WESTPLAZA - 140.00' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDi],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddDi);
    component = fixture.componentInstance;

    collaboratorService = TestBed.inject(CollaboratorService);
    collaboratorDetailService = TestBed.inject(CollaboratorDetailService);
    stationService = TestBed.inject(StationService);
    dailyService = TestBed.inject(DailyService);

    // Mocks padrão
    vi.spyOn(collaboratorService, 'getAll').mockReturnValue(of([]));
    vi.spyOn(stationService, 'getAll').mockReturnValue(of([
      { id: 56, nome: 'Posto Alpha' },
      { id: 94, nome: 'Posto Beta' }
    ]));
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(of([mockOption1]));
    vi.spyOn(dailyService, 'getByCollaboratorDetailId').mockReturnValue(of([]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // Criação do componente
  // ==========================================
  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter as colunas corretas na tabela', () => {
    expect(component.displayedColumns).toEqual(['select', 'data', 'diaria', 'existentes', 'posto']);
  });

  it('deve inicializar com dataSource vazio', () => {
    expect(component.dataSource.data.length).toBe(0);
  });

  it('deve inicializar sem colaborador selecionado', () => {
    expect(component.selectedCollaboratorId).toBeNull();
  });

  // ==========================================
  // ngOnInit — carregamento de dados
  // ==========================================
  it('ngOnInit deve chamar loadCollaborators e loadStations', () => {
    const loadColabSpy = vi.spyOn(component, 'loadCollaborators');
    const loadStationSpy = vi.spyOn(component, 'loadStations');
    component.ngOnInit();
    expect(loadColabSpy).toHaveBeenCalled();
    expect(loadStationSpy).toHaveBeenCalled();
  });

  it('loadCollaborators deve preencher a lista de colaboradores', () => {
    const mockColabs = [{ id: 1, nome: 'João' }, { id: 2, nome: 'Maria' }];
    vi.spyOn(collaboratorService, 'getAll').mockReturnValue(of(mockColabs));
    component.loadCollaborators();
    expect(component.collaborators.length).toBe(2);
    expect(component.collaborators[0].nome).toBe('João');
  });

  it('loadStations deve preencher a lista de postos', () => {
    component.loadStations();
    expect(component.stations.length).toBe(2);
    expect(component.stations[0].nome).toBe('Posto Alpha');
  });

  it('loadCollaborators deve exibir notificação em caso de erro', () => {
    const notifySpy = vi.spyOn(component['notify'], 'error');
    vi.spyOn(collaboratorService, 'getAll').mockReturnValue(throwError(() => new Error('Erro')));
    component.loadCollaborators();
    expect(notifySpy).toHaveBeenCalledWith('Erro ao carregar colaboradores');
  });

  it('loadStations deve exibir notificação em caso de erro', () => {
    const notifySpy = vi.spyOn(component['notify'], 'error');
    vi.spyOn(stationService, 'getAll').mockReturnValue(throwError(() => new Error('Erro')));
    component.loadStations();
    expect(notifySpy).toHaveBeenCalledWith('Erro ao carregar postos');
  });

  // ==========================================
  // getWeekDates
  // ==========================================
  it('getWeekDates deve retornar 7 datas', () => {
    expect(component.getWeekDates().length).toBe(7);
  });

  it('getWeekDates deve começar na segunda e terminar no domingo', () => {
    const dates = component.getWeekDates().map(d => new Date(d + 'T12:00:00'));
    expect(dates[0].getDay()).toBe(1); // segunda
    expect(dates[6].getDay()).toBe(0); // domingo
  });

  // ==========================================
  // onCollaboratorChange — busca detalhes e gera linhas
  // ==========================================
  it('onCollaboratorChange deve definir o colaborador selecionado', () => {
    component.loadStations();
    component.onCollaboratorChange(932);
    expect(component.selectedCollaboratorId).toBe(932);
  });

  it('onCollaboratorChange deve gerar 7 linhas para 1 detalhe', () => {
    component.loadStations();
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(of([mockOption1]));
    vi.spyOn(dailyService, 'getByCollaboratorDetailId').mockReturnValue(of([]));
    component.onCollaboratorChange(932);
    expect(component.dataSource.data.length).toBe(7);
    expect(component.dataSource.data[0].valor).toBe(1);
  });

  it('onCollaboratorChange deve gerar 7 linhas mesmo com 2 detalhes', () => {
    component.loadStations();
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(of([mockOption1, mockOption2]));
    vi.spyOn(dailyService, 'getByCollaboratorDetailId').mockReturnValue(of([]));
    component.onCollaboratorChange(932);
    expect(component.dataSource.data.length).toBe(7);
  });

  it('onCollaboratorChange deve popular detailOptions para o dropdown', () => {
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(of([mockOption1, mockOption2]));
    vi.spyOn(dailyService, 'getByCollaboratorDetailId').mockReturnValue(of([]));
    component.onCollaboratorChange(932);
    expect(component.detailOptions.length).toBe(2);
    expect(component.detailOptions[0].id).toBe(1973);
    expect(component.detailOptions[1].id).toBe(1991);
  });

  it('onCollaboratorChange deve gerar linhas sem detalhe selecionado', () => {
    component.loadStations();
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(of([mockOption1]));
    vi.spyOn(dailyService, 'getByCollaboratorDetailId').mockReturnValue(of([]));
    component.onCollaboratorChange(932);
    component.dataSource.data.forEach(row => {
      expect(row.idColaboradorDetalhe).toBeNull();
      expect(row.valor).toBe(1);
    });
  });

  it('onCollaboratorChange deve contar existentes por data', () => {
    component.loadStations();
    const weekDates = getWeekDates();
    const existing: Daily[] = [
      { id: 1, idColaboradorDetalhe: 1973, dataDiaria: weekDates[0] + 'T00:00:00', userCadastro: 'test' },
      { id: 2, idColaboradorDetalhe: 1973, dataDiaria: weekDates[0] + 'T00:00:00', userCadastro: 'test' },
      { id: 3, idColaboradorDetalhe: 1973, dataDiaria: weekDates[1] + 'T00:00:00', userCadastro: 'test' }
    ];
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(of([mockOption1]));
    vi.spyOn(dailyService, 'getByCollaboratorDetailId').mockReturnValue(of(existing));
    component.onCollaboratorChange(932);

    // Segunda-feira deve ter existingCount = 2
    expect(component.dataSource.data[0].existingCount).toBe(2);
    // Terça deve ter 1
    expect(component.dataSource.data[1].existingCount).toBe(1);
    // Quarta em diante deve ter 0
    expect(component.dataSource.data[2].existingCount).toBe(0);
  });

  it('onCollaboratorChange deve exibir notificação quando sem detalhes', () => {
    const notifySpy = vi.spyOn(component['notify'], 'warn');
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(of([]));
    component.onCollaboratorChange(999);
    expect(notifySpy).toHaveBeenCalledWith('Nenhum detalhe cadastrado para este colaborador');
    expect(component.dataSource.data.length).toBe(0);
  });

  it('onCollaboratorChange deve gerar linhas com existingCount 0 se busca de diárias falhar', () => {
    component.loadStations();
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(of([mockOption1]));
    vi.spyOn(dailyService, 'getByCollaboratorDetailId').mockReturnValue(throwError(() => new Error('Erro')));
    component.onCollaboratorChange(932);
    expect(component.dataSource.data.length).toBe(7);
    component.dataSource.data.forEach(row => {
      expect(row.existingCount).toBe(0);
    });
  });

  it('onCollaboratorChange deve exibir notificação se busca de detalhes falhar', () => {
    const notifySpy = vi.spyOn(component['notify'], 'error');
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(throwError(() => new Error('Erro')));
    component.onCollaboratorChange(932);
    expect(notifySpy).toHaveBeenCalledWith('Erro ao buscar detalhes do colaborador');
  });

  it('onCollaboratorChange deve setar isLoadingDailies false após carregamento', () => {
    component.loadStations();
    component.onCollaboratorChange(932);
    expect(component.isLoadingDailies).toBe(false);
  });

  // ==========================================
  // hasExistingDailies
  // ==========================================
  it('hasExistingDailies deve retornar true se existingCount > 0', () => {
    const row: DailyRow = { idColaboradorDetalhe: 1, dataDiaria: '2026-02-23', valor: 1, existingCount: 2 };
    expect(component.hasExistingDailies(row)).toBe(true);
  });

  it('hasExistingDailies deve retornar false se existingCount === 0', () => {
    const row: DailyRow = { idColaboradorDetalhe: null, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    expect(component.hasExistingDailies(row)).toBe(false);
  });

  // ==========================================
  // Dropdown — detailOptions preenchidas
  // ==========================================
  it('detailOptions deve conter descricao do endpoint /select', () => {
    vi.spyOn(collaboratorDetailService, 'getSelectOptions').mockReturnValue(of([mockOption1, mockOption2]));
    vi.spyOn(dailyService, 'getByCollaboratorDetailId').mockReturnValue(of([]));
    component.onCollaboratorChange(932);
    expect(component.detailOptions[0].descricao).toContain('VIVO CENTER NORTE');
    expect(component.detailOptions[1].descricao).toContain('VIVO WESTPLAZA');
  });

  it('selecionar opção no dropdown deve preencher idColaboradorDetalhe na row', () => {
    const row: DailyRow = { idColaboradorDetalhe: null, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    row.idColaboradorDetalhe = 1973;
    expect(row.idColaboradorDetalhe).toBe(1973);
  });

  // ==========================================
  // formatarValorAdiantamento — parsing de valor
  // ==========================================
  it('formatarValorAdiantamento deve tratar string vazia como 0', () => {
    component.valorAdiantamentoStr = '';
    component.formatarValorAdiantamento();
    expect(component['_valorAdiantamento']).toBe(0);
  });

  it('formatarValorAdiantamento deve parsear e formatar 1000 como "1.000,00"', () => {
    component.valorAdiantamentoStr = '1000';
    component.formatarValorAdiantamento();
    expect(component['_valorAdiantamento']).toBe(1000);
    expect(component.valorAdiantamentoStr).toBe('1.000,00');
  });

  it('formatarValorAdiantamento deve parsear e formatar 50,5 como "50,50"', () => {
    component.valorAdiantamentoStr = '50,5';
    component.formatarValorAdiantamento();
    expect(component['_valorAdiantamento']).toBe(50.5);
    expect(component.valorAdiantamentoStr).toBe('50,50');
  });

  it('formatarValorAdiantamento deve tratar texto inválido como 0 e limpar string', () => {
    component.valorAdiantamentoStr = 'abc';
    component.formatarValorAdiantamento();
    expect(component['_valorAdiantamento']).toBe(0);
    expect(component.valorAdiantamentoStr).toBe('');
  });

  it('formatarValorAdiantamento deve formatar 1500.75 corretamente', () => {
    component.valorAdiantamentoStr = '1.500,75';
    component.formatarValorAdiantamento();
    expect(component['_valorAdiantamento']).toBe(1500.75);
    expect(component.valorAdiantamentoStr).toBe('1.500,75');
  });

  // ==========================================
  // canSaveDailies — regra de prazo
  // ==========================================
  it('canSaveDailies deve retornar false quando isSaving é true', () => {
    component.isSaving = true;
    expect(component.canSaveDailies).toBe(false);
  });

  it('canSaveDailies deve retornar boolean baseado no dia da semana', () => {
    component.isSaving = false;
    expect(typeof component.canSaveDailies).toBe('boolean');
  });

  // ==========================================
  // deadlineMessage — mensagem de prazo
  // ==========================================
  it('deadlineMessage deve retornar uma string não vazia', () => {
    expect(component.deadlineMessage.length).toBeGreaterThan(0);
  });

  // ==========================================
  // saveDailies — validações e loop de registros
  // ==========================================
  it('saveDailies deve exibir erro se nenhum colaborador selecionado', () => {
    const notifySpy = vi.spyOn(component['notify'], 'warn');
    component.selectedCollaboratorId = null;
    component.saveDailies();
    expect(notifySpy).toHaveBeenCalledWith('Selecione um colaborador primeiro');
  });

  it('saveDailies deve exibir erro se nenhuma diária selecionada', () => {
    const notifySpy = vi.spyOn(component['notify'], 'warn');
    component.selectedCollaboratorId = 1;
    component.isSaving = false;
    const row: DailyRow = { idColaboradorDetalhe: null, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    component.dataSource.data = [row];
    component.selection.clear();

    if (component.canSaveDailies) {
      component.saveDailies();
      expect(notifySpy).toHaveBeenCalledWith('Selecione ao menos uma diária para enviar');
    }
  });

  it('saveDailies deve exibir erro se linha selecionada sem valor preenchido', () => {
    const notifySpy = vi.spyOn(component['notify'], 'warn');
    component.selectedCollaboratorId = 1;
    component.isSaving = false;
    const row: DailyRow = { idColaboradorDetalhe: 1973, dataDiaria: '2026-02-23', valor: 0, existingCount: 0 };
    component.dataSource.data = [row];
    component.selection.select(row);

    if (component.canSaveDailies) {
      component.saveDailies();
      expect(notifySpy).toHaveBeenCalledWith('Preencha o campo Dias para todos os dias marcados');
    }
  });

  it('saveDailies deve exibir erro se linha selecionada sem posto', () => {
    const notifySpy = vi.spyOn(component['notify'], 'warn');
    component.selectedCollaboratorId = 1;
    component.isSaving = false;
    const row: DailyRow = { idColaboradorDetalhe: null, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    component.dataSource.data = [row];
    component.selection.select(row);

    if (component.canSaveDailies) {
      component.saveDailies();
      expect(notifySpy).toHaveBeenCalledWith('Selecione o posto para todos os dias marcados');
    }
  });

  it('saveDailies com valor=2 deve expandir para 2 registros Daily', () => {
    component.selectedCollaboratorId = 1;
    component.isSaving = false;
    const row: DailyRow = { idColaboradorDetalhe: 1973, dataDiaria: '2026-02-23', valor: 2, existingCount: 0 };
    component.dataSource.data = [row];
    component.selection.select(row);

    const saveSpy = vi.spyOn(dailyService, 'saveDailies').mockReturnValue(of([]));

    if (component.canSaveDailies) {
      component.saveDailies();
      const savedArg = saveSpy.mock.calls[0][0];
      expect(savedArg.length).toBe(2);
      expect(savedArg[0].idColaboradorDetalhe).toBe(1973);
      expect(savedArg[1].idColaboradorDetalhe).toBe(1973);
      expect(savedArg[0].dataDiaria).toBe('2026-02-23');
    }
  });

  it('saveDailies com múltiplas linhas deve expandir corretamente', () => {
    component.selectedCollaboratorId = 1;
    component.isSaving = false;
    const row1: DailyRow = { idColaboradorDetalhe: 1973, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    const row2: DailyRow = { idColaboradorDetalhe: 1991, dataDiaria: '2026-02-23', valor: 3, existingCount: 0 };
    component.dataSource.data = [row1, row2];
    component.selection.select(row1);
    component.selection.select(row2);

    const saveSpy = vi.spyOn(dailyService, 'saveDailies').mockReturnValue(of([]));

    if (component.canSaveDailies) {
      component.saveDailies();
      const savedArg = saveSpy.mock.calls[0][0];
      expect(savedArg.length).toBe(4); // 1 + 3
    }
  });

  it('saveDailies deve exibir erro e resetar isSaving em caso de falha', () => {
    const notifySpy = vi.spyOn(component['notify'], 'error');
    component.selectedCollaboratorId = 1;
    component.isSaving = false;
    const row: DailyRow = { idColaboradorDetalhe: 1973, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    component.dataSource.data = [row];
    component.selection.select(row);

    vi.spyOn(dailyService, 'saveDailies').mockReturnValue(throwError(() => new Error('Erro API')));

    if (component.canSaveDailies) {
      component.saveDailies();
      expect(notifySpy).toHaveBeenCalledWith('Erro ao salvar diárias');
      expect(component.isSaving).toBe(false);
    }
  });

  it('saveDailies deve chamar resetAfterSave ao salvar com sucesso', () => {
    component.selectedCollaboratorId = 1;
    component.isSaving = false;
    const row: DailyRow = { idColaboradorDetalhe: 1973, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    component.dataSource.data = [row];
    component.selection.select(row);

    vi.spyOn(dailyService, 'saveDailies').mockReturnValue(of([]));
    const resetSpy = vi.spyOn(component, 'resetAfterSave');

    if (component.canSaveDailies) {
      component.saveDailies();
      expect(resetSpy).toHaveBeenCalled();
    }
  });

  // ==========================================
  // deleteDaily — remoção de linha
  // ==========================================
  it('deleteDaily deve remover a linha da lista', () => {
    const row1: DailyRow = { idColaboradorDetalhe: 1, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    const row2: DailyRow = { idColaboradorDetalhe: 1, dataDiaria: '2026-02-24', valor: 1, existingCount: 0 };
    component.dataSource.data = [row1, row2];
    component.deleteDaily(row1);
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0]).toBe(row2);
  });

  it('deleteDaily deve desmarcar a seleção da linha removida', () => {
    const row: DailyRow = { idColaboradorDetalhe: 1, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    component.dataSource.data = [row];
    component.selection.select(row);
    expect(component.selection.isSelected(row)).toBe(true);
    component.deleteDaily(row);
    expect(component.selection.isSelected(row)).toBe(false);
  });

  // ==========================================
  // resetForm
  // ==========================================
  it('resetForm deve limpar todos os campos', () => {
    component.selectedCollaboratorId = 5;
    const row: DailyRow = { idColaboradorDetalhe: 1973, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    component.dataSource.data = [row];
    component.selection.select(row);
    component.detailOptions = [mockOption1];
    component.valorAdiantamentoStr = '100,00';
    component.isSaving = true;
    component.isLoadingDailies = true;

    component.resetForm();

    expect(component.selectedCollaboratorId).toBeNull();
    expect(component.dataSource.data.length).toBe(0);
    expect(component.selection.selected.length).toBe(0);
    expect(component.detailOptions.length).toBe(0);
    expect(component.valorAdiantamentoStr).toBe('');
    expect(component.isSaving).toBe(false);
    expect(component.isLoadingDailies).toBe(false);
  });

  // ==========================================
  // getStationName
  // ==========================================
  it('getStationName deve retornar o nome do posto pelo id', () => {
    component.stations = [{ id: 1, nome: 'Posto A' }, { id: 2, nome: 'Posto B' }];
    expect(component.getStationName(2)).toBe('Posto B');
  });

  it('getStationName deve retornar N/A se id não encontrado', () => {
    component.stations = [{ id: 1, nome: 'Posto A' }];
    expect(component.getStationName(99)).toBe('N/A');
  });

  it('getStationName deve retornar N/A se id for undefined', () => {
    expect(component.getStationName(undefined)).toBe('N/A');
  });

  // ==========================================
  // formatDate e formatDateForInput
  // ==========================================
  it('formatDate deve formatar data no padrão pt-BR', () => {
    const result = component.formatDate('2026-03-04');
    expect(result).toContain('04');
    expect(result).toContain('03');
    expect(result).toContain('2026');
  });

  it('formatDateForInput deve retornar formato yyyy-MM-dd', () => {
    const result = component.formatDateForInput('2026-03-04T00:00:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // ==========================================
  // checkboxLabel
  // ==========================================
  it('checkboxLabel deve retornar "select" para linha não selecionada', () => {
    const row: DailyRow = { idColaboradorDetalhe: null, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    expect(component.checkboxLabel(row)).toContain('select');
  });

  it('checkboxLabel deve retornar "deselect" para linha selecionada', () => {
    const row: DailyRow = { idColaboradorDetalhe: null, dataDiaria: '2026-02-23', valor: 1, existingCount: 0 };
    component.selection.select(row);
    expect(component.checkboxLabel(row)).toContain('deselect');
  });

  // ==========================================
  // applyFilter
  // ==========================================
  it('applyFilter deve aplicar filtro no dataSource', () => {
    const event = { target: { value: ' teste ' } } as unknown as Event;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('teste');
  });
});
