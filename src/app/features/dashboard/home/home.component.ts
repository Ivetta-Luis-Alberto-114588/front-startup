import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../products/services/category/category.service';
import { ICategory } from '../../products/model/icategory';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public listCategories: ICategory[] = [];


  constructor(
    private categoryService: CategoryService,
  ) { }

  ngOnInit(): void {
    this.getAllCategories();
  }

  getAllCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.listCategories = data;
      },
      error: (error) => {
        console.log('Error fetching categories', error);
      }
    });
  }



}