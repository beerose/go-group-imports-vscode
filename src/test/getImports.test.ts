import * as assert from 'assert';

import { getImports } from '../utils';

suite('GetImports Test', () => {
  test('should return empty list if no imports in file', () => {
    const documentText = `
    package main

    func main() {}
    `;
    const imports = getImports(documentText);

    assert.deepEqual(imports, []);
  });

  test('should return empty list if no multiline imports in file', () => {
    const documentText = `
    package main

    import "fmt"

    func main() {
      fmt.Println("Hello!")
    }
    `;
    const imports = getImports(documentText);

    assert.deepEqual(imports, []);
  });

  test('should return all imports from file', () => {
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
    const imports = getImports(documentText);
    assert.equal(imports.length, 3);
    imports.forEach(imp => assert.ok(documentText.includes(imp)));
  });

  test('should return all imports from file without empty lines', () => {
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
    const imports = getImports(documentText);

    assert.equal(imports.length, 3);
    imports.forEach(imp => assert.ok(documentText.includes(imp)));
  });
});
