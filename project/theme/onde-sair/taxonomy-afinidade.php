<?php
/**
 * Taxonomy · Afinidade
 * Páginas SEO: /para-dates, /pra-impressionar, /pra-turistar...
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();
$term = get_queried_object();

// Outras afinidades pra linkar (cross-link interno)
$other_affs = get_terms( [ 'taxonomy' => 'afinidade', 'exclude' => [ $term->term_id ], 'hide_empty' => false ] );

// Tipos pra refinar
$tipos = get_terms( [ 'taxonomy' => 'tipo', 'hide_empty' => false ] );
?>

<div class="shell">

    <section class="hero">
        <span class="eyebrow">Curadoria · Afinidade</span>
        <div class="hero-grid">
            <h1><?php echo esc_html( $term->name ); ?><br><span class="it">em <?php echo esc_html( ondesair_current_city() ); ?>.</span></h1>
            <aside class="hero-side">
                <p class="lede" style="margin:0;max-width:42ch;"><?php echo esc_html( term_description( $term ) ? wp_strip_all_tags( term_description( $term ) ) : 'Os lugares que combinam com essa intenção. Selecionados, ordenados e testados pelo time.' ); ?></p>
                <p class="mute small" style="margin-top:18px;"><?php echo (int) $term->count; ?> lugares · atualizado este mês</p>
            </aside>
        </div>
    </section>

    <?php if ( ! empty( $tipos ) && ! is_wp_error( $tipos ) ) : ?>
    <section class="section tight">
        <span class="eyebrow">Refine por tipo</span>
        <div class="type-rail" style="margin-top:12px;">
            <?php foreach ( $tipos as $t ) : ?>
                <a class="chip-type" href="<?php echo esc_url( add_query_arg( 'tipo', $t->slug ) ); ?>"><?php echo esc_html( $t->name ); ?></a>
            <?php endforeach; ?>
        </div>
    </section>
    <?php endif; ?>

    <section class="section">
        <?php if ( have_posts() ) : ?>
            <div class="places-grid">
                <?php while ( have_posts() ) : the_post();
                    $tipos_p = get_the_terms( get_the_ID(), 'tipo' );
                    $tipo_lbl = ( $tipos_p && ! is_wp_error( $tipos_p ) ) ? $tipos_p[0]->name : '';
                ?>
                    <a class="card place interactive" href="<?php the_permalink(); ?>">
                        <?php ondesair_thumb( 'os-card', $tipo_lbl ); ?>
                        <div class="body">
                            <?php if ( $tipo_lbl ) : ?><span class="chip-type"><?php echo esc_html( $tipo_lbl ); ?></span><?php endif; ?>
                            <h4><?php the_title(); ?></h4>
                            <p class="sub"><?php echo esc_html( ondesair_meta( '_os_bairro' ) ); ?> · <?php echo wp_kses_post( get_the_excerpt() ); ?></p>
                        </div>
                        <div class="footer">
                            <span class="stars">★ <?php echo esc_html( ondesair_meta( '_os_rating', '4.7' ) ); ?></span>
                            <span><?php echo esc_html( ondesair_price_label() ); ?></span>
                        </div>
                    </a>
                <?php endwhile; ?>
            </div>
            <div class="row" style="justify-content:center;margin-top:32px;">
                <?php the_posts_pagination( [ 'mid_size' => 1, 'prev_text' => '← Anteriores', 'next_text' => 'Próximos →' ] ); ?>
            </div>
        <?php else : ?>
            <p class="mute" style="text-align:center;padding:48px 0;">Nada por aqui ainda. <a href="<?php echo esc_url( home_url( '/' ) ); ?>" style="color:var(--primary);text-decoration:underline;">Voltar pra Home</a>.</p>
        <?php endif; ?>
    </section>

    <?php if ( ! empty( $other_affs ) && ! is_wp_error( $other_affs ) ) : ?>
    <section class="section">
        <div class="head">
            <div>
                <span class="eyebrow">Outras afinidades</span>
                <h2>Procurando outra coisa?</h2>
            </div>
        </div>
        <div class="row" style="gap:10px;">
            <?php foreach ( $other_affs as $a ) : ?>
                <a class="chip muted" href="<?php echo esc_url( get_term_link( $a ) ); ?>"><?php echo esc_html( $a->name ); ?></a>
            <?php endforeach; ?>
        </div>
    </section>
    <?php endif; ?>

</div>

<?php get_footer();
