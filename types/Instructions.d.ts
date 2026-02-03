interface Instrcutions {
    cook_time_minutes: number;
    
    ingredients: {
        name: string;
        quantity: string;
    }[];
    
    name: string;
    
    servings: number;
    
    steps: {
        instruction: string;
        order: number;
        title: string;
    }[];

    tips: string[];
}   
