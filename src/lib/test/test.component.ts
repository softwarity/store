import {Component} from '@angular/core';
import {LocalStored, SessionStored} from '../decorator';

@Component({
  template: ``,
  styles: []
})
export class TestComponent {

  @LocalStored(1, 'test0')
  local = {foo: 5};

  @LocalStored(1, 'test-arr')
  localArr = {items: ['a', 'b', 'c']};

  @SessionStored('test')
  session = {foo: 5};


}
