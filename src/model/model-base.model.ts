/**
 * Esta Es la clase del modelo Base
 * que todos los modelos de la API van a extender
 * para facilitarnos el desarrollo
 */
export class ModelBase {
    #reference: any;
    #model: any;

    /**
     * Este metodo nos se encarga de poner en los atributos
     * del padre la referencia de la clase hija y el modelo
     * que se debe cargar
     * @param reference 
     * @param model 
     */
    protected getReferenceAndModel(reference: any, model: any) {
        this.#reference = reference;
        this.#model = model;
    }

    /**
     * Esta función se encarga de cargar las propiedades
     * del modelo siempre y cuando coincidan con el nombre
     * esto hace una asignación automatica
     */
    protected loadModel() {
        if (this.#reference && this.#model) {
            const properties = Object.getOwnPropertyNames(this.#reference).filter(
                (prop) => !['_reference', '_model'].includes(prop) // Ya no es necesario, pero lo dejamos como ejemplo
            );

            for (const prop of properties) {
                if (Object.prototype.hasOwnProperty.call(this.#model, prop)) {
                    this.#reference[prop] = this.#model[prop];
                }
            }
        }
    }

    /**
     * Esta funcion se encarga de eliminar
     * las propiedades del objeto que tiene como
     * valor null, esto nos ayuda y nos facilita
     * a la hora de interactuar con la base de datos
     */
    public removeNullReferences() {
        if (this.#reference) {
            Object.entries(this.#reference).forEach(([key, value]) => {
                if (value === null) {
                    delete this.#reference[key];
                }
            });
        }
    }

    /**
     * Esta funcion se encarga de eliminar
     * las propiedades del objeto que tiene como
     * valor un campo vacio o un espacio, esto nos
     * facilita a la hora de interactuar con la base
     * de datos
     */
    public removeEmptySpaces() {
        if (this.#reference) {
            Object.entries(this.#reference).forEach(([key, value]) => {
                if (value === '' || value === ' ') {
                    delete this.#reference[key];
                }
            });
        }
    }
}
