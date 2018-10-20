import * as assert from 'assert';

import { getImportsRange } from '../utils';

suite('GetImportsRange Test', () => {
  test('should return file lines count for file without imports', () => {
    const documentText = `
    package main

    func main() {}
    `;
    const range = getImportsRange(documentText);

    assert.equal(range.start, documentText.split('\n').length + 1);
    assert.equal(range.end, documentText.split('\n').length + 1);
  });

  test('should return file lines count if no multiline imports in file', () => {
    const documentText = `
    package main

    import "fmt"

    func main() {
      fmt.Println("Hello!")
    }
    `;
    const range = getImportsRange(documentText);

    assert.equal(range.start, documentText.split('\n').length + 1);
    assert.equal(range.end, documentText.split('\n').length + 1);
  });

  test('should return proper range on import statements in file', () => {
    const documentText = `
    package main

    import (
      "fmt"
      "strings"
      "github.com/blackdahila/package"
    )

    func main() {
      fmt.Println("Hello!")
      package.FindAllIds(strings.Split("1, 2, 3, 4", ","))
    }
    `;
    const range = getImportsRange(documentText);

    assert.equal(range.start, 4);
    assert.equal(range.end, 7);
  });

  test('should return proper range on import statements in file regaridng empty lines', () => {
    const documentText = `
    package main

    import (
      "fmt"

      "strings"

      "github.com/blackdahila/package"
    )

     func main() {
       fmt.Println("Hello!")
       package.FindAllIds(strings.Split("1, 2, 3, 4", ","))
     }
     `;
    const range = getImportsRange(documentText);

    assert.equal(range.start, 4);
    assert.equal(range.end, 9);
  });
});
