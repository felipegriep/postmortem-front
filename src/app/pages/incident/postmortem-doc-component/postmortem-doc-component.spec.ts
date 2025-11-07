import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { PostmortemDocComponent } from './postmortem-doc-component';
import { ToastService } from '../../../shared/toast.service';

describe('PostmortemDocComponent', () => {
  let component: PostmortemDocComponent;
  let fixture: ComponentFixture<PostmortemDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostmortemDocComponent],
      providers: [
        {
          provide: 'PostmortemDocService',
          useValue: {
            list: () => of([]),
            get: () => of(''),
            create: () => of({ version: 1 } as any),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              snapshot: { paramMap: convertToParamMap({ id: '1' }) },
              paramMap: of(convertToParamMap({ id: '1' })),
            },
            snapshot: { paramMap: convertToParamMap({}) },
            paramMap: of(convertToParamMap({})),
          },
        },
        {
          provide: ToastService,
          useValue: {
            success: jasmine.createSpy('success'),
            error: jasmine.createSpy('error'),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostmortemDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
